import Automation from "@/models/Automation";
import AutomationRun from "@/models/AutomationRun";
import Contact from "@/models/Contact";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import {
  sendTextMessage,
  sendInteractiveButtons,
  sendInteractiveList,
} from "@/lib/meta/service";
import { decryptToken } from "@/lib/security/encryption";

const MAX_EXECUTION_STEPS = 15;

export interface AutomationTriggerContext {
  workspaceId: string;
  phoneNumberId: string;
  customerPhone: string;
  customerName: string;
  messageType: string;
  text: string;
  buttonId?: string;
  listRowId?: string;
  isNewConversation?: boolean;
}

interface ContactContext {
  name?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
}

/**
 * Replaces {{variable}} placeholders with real contact and message variables.
 */
function interpolateVariables(template: string, contact: ContactContext | null | undefined, context: AutomationTriggerContext): string {
  if (!template) return "";

  let result = template
    .replace(/\{\{\s*name\s*\}\}/gi, contact?.name || "Customer")
    .replace(/\{\{\s*phone\s*\}\}/gi, contact?.phone || context.customerPhone)
    .replace(/\{\{\s*message\s*\}\}/gi, context.text || "");

  // Support {{customFields.fieldName}} or {{fieldName}}
  if (contact?.customFields && typeof contact.customFields === "object") {
    for (const [key, val] of Object.entries(contact.customFields)) {
      const regex1 = new RegExp(`\\{\\{\\s*customFields\\.${key}\\s*\\}\\}`, "gi");
      const regex2 = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
      result = result.replace(regex1, String(val ?? "")).replace(regex2, String(val ?? ""));
    }
  }

  return result;
}

/**
 * Evaluates a condition block (IF / THEN / ELSE) against contact fields or incoming text.
 */
function evaluateCondition(
  conditionConfig: {
    field?: string;
    operator?: string;
    value?: string;
  },
  contact: ContactContext | null | undefined,
  context: AutomationTriggerContext
): boolean {
  if (!conditionConfig || !conditionConfig.field) return true;

  const { field, operator = "==", value = "" } = conditionConfig;
  let targetVal: unknown = "";

  if (field === "name") targetVal = contact?.name || "";
  else if (field === "phone") targetVal = contact?.phone || "";
  else if (field === "message" || field === "text") targetVal = context.text || "";
  else if (contact?.customFields && contact.customFields[field] !== undefined) {
    targetVal = contact.customFields[field];
  }

  const stringTarget = String(targetVal ?? "").trim().toLowerCase();
  const stringCompare = String(value ?? "").trim().toLowerCase();

  switch (operator) {
    case "==":
    case "equals":
      return stringTarget === stringCompare;
    case "!=":
    case "not_equals":
      return stringTarget !== stringCompare;
    case "contains":
      return stringTarget.includes(stringCompare);
    case "not_contains":
      return !stringTarget.includes(stringCompare);
    case ">":
      return parseFloat(stringTarget) > parseFloat(stringCompare);
    case "<":
      return parseFloat(stringTarget) < parseFloat(stringCompare);
    default:
      return stringTarget === stringCompare;
  }
}

/**
 * Main Data-Driven Automation Engine.
 * Evaluates active automations for the workspace and runs matching actions with safety limits.
 */
export async function processAutomationsForMessage(context: AutomationTriggerContext) {
  const { workspaceId, phoneNumberId, customerPhone, text, buttonId, listRowId, isNewConversation } = context;

  // SAFETY: Anti-loop guard. Only incoming messages trigger automations.
  const cleanedText = (text || "").trim().toLowerCase();

  // Find active WhatsApp account for this workspace
  const account = await WhatsAppAccount.findOne({ workspaceId, status: "connected" });
  if (!account) {
    console.log(`[AUTOMATION_ENGINE] No active WhatsApp account for workspace ${workspaceId}. Skipping.`);
    return;
  }

  // Decrypt token for sending outbound replies
  let token = "";
  try {
    token = decryptToken(account.accessTokenEncrypted);
  } catch (err) {
    console.error(`[AUTOMATION_ENGINE] Failed to decrypt token for workspace ${workspaceId}:`, err);
    return;
  }

  // Load Contact and Conversation
  const contact = await Contact.findOne({ workspaceId, phone: customerPhone });
  const conversation = await Conversation.findOne({ workspaceId, customerPhone });

  // Find all active automations for this tenant
  const automations = await Automation.find({ workspaceId, isActive: true }).sort({ createdAt: 1 });
  if (!automations || automations.length === 0) {
    return;
  }

  // Find matching automation
  let matchedAutomation = null;

  for (const auto of automations) {
    const trigger = auto.trigger;
    if (!trigger) continue;

    if (trigger.type === "keyword") {
      const targetKeyword = (trigger.keyword || "").trim().toLowerCase();
      if (!targetKeyword) continue;

      if (trigger.matching === "contains") {
        if (cleanedText.includes(targetKeyword)) {
          matchedAutomation = auto;
          break;
        }
      } else {
        // exact match
        if (cleanedText === targetKeyword) {
          matchedAutomation = auto;
          break;
        }
      }
    } else if (trigger.type === "button_reply") {
      const matchButtonId = trigger.buttonId ? trigger.buttonId.toLowerCase() : "";
      const matchKeyword = trigger.keyword ? trigger.keyword.toLowerCase() : "";
      if (
        (buttonId && matchButtonId && buttonId.toLowerCase() === matchButtonId) ||
        (cleanedText && matchKeyword && cleanedText === matchKeyword)
      ) {
        matchedAutomation = auto;
        break;
      }
    } else if (trigger.type === "list_reply") {
      const matchListId = trigger.listRowId ? trigger.listRowId.toLowerCase() : "";
      const matchKeyword = trigger.keyword ? trigger.keyword.toLowerCase() : "";
      if (
        (listRowId && matchListId && listRowId.toLowerCase() === matchListId) ||
        (cleanedText && matchKeyword && cleanedText === matchKeyword)
      ) {
        matchedAutomation = auto;
        break;
      }
    } else if (trigger.type === "conversation_started" && isNewConversation) {
      matchedAutomation = auto;
      break;
    } else if (trigger.type === "incoming_message") {
      // General catch-all incoming message trigger
      matchedAutomation = auto;
      break;
    }
  }

  if (!matchedAutomation) {
    return;
  }

  console.log(`[AUTOMATION_TRIGGER] workspaceId=${workspaceId} ruleName="${matchedAutomation.name}"`);

  // Create AutomationRun log entry
  const runDoc = await AutomationRun.create({
    workspaceId,
    automationId: matchedAutomation._id,
    contactId: contact?._id,
    customerPhone,
    triggerValue: text || buttonId || listRowId || "conversation_started",
    status: "running",
    stepsExecuted: 0,
  });

  let stepsCount = 0;

  try {
    const actionsToExecute = [...(matchedAutomation.actions || [])];

    while (actionsToExecute.length > 0) {
      if (stepsCount >= MAX_EXECUTION_STEPS) {
        console.warn(`[AUTOMATION_SAFETY] Max execution steps (${MAX_EXECUTION_STEPS}) reached for run ${runDoc._id}. Aborting.`);
        break;
      }

      const action = actionsToExecute.shift();
      if (!action) continue;

      stepsCount++;

      // Action: Send Text
      if (action.type === "send_text") {
        const rawBody = action.payload?.text || "";
        const formattedBody = interpolateVariables(rawBody, contact, context);

        if (formattedBody) {
          const sendRes = await sendTextMessage(phoneNumberId, token, customerPhone, formattedBody);
          if (sendRes.success && conversation) {
            await Message.create({
              workspaceId,
              conversationId: conversation._id,
              direction: "outgoing",
              type: "text",
              text: formattedBody,
              whatsappMessageId: sendRes.messageId,
              status: "sent",
              timestamp: new Date(),
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();
          }
        }
      }

      // Action: Send Interactive Buttons
      else if (action.type === "send_interactive_buttons") {
        const prompt = interpolateVariables(action.payload?.text || "Please select an option:", contact, context);
        const buttons = action.payload?.buttons || ["Option 1", "Option 2"];

        const sendRes = await sendInteractiveButtons(phoneNumberId, token, customerPhone, prompt, buttons);
        if (sendRes.success && conversation) {
          await Message.create({
            workspaceId,
            conversationId: conversation._id,
            direction: "outgoing",
            type: "interactive",
            text: `${prompt} [Buttons: ${buttons.join(", ")}]`,
            whatsappMessageId: sendRes.messageId,
            status: "sent",
            timestamp: new Date(),
          });
          conversation.lastMessageAt = new Date();
          await conversation.save();
        }
      }

      // Action: Send Interactive List
      else if (action.type === "send_interactive_list") {
        const prompt = interpolateVariables(action.payload?.text || "Please choose from the menu:", contact, context);
        const buttonText = action.payload?.buttonText || "View Menu";
        const sections = action.payload?.sections || [];

        if (sections.length > 0) {
          const sendRes = await sendInteractiveList(phoneNumberId, token, customerPhone, prompt, buttonText, sections);
          if (sendRes.success && conversation) {
            await Message.create({
              workspaceId,
              conversationId: conversation._id,
              direction: "outgoing",
              type: "interactive",
              text: `${prompt} [List: ${buttonText}]`,
              whatsappMessageId: sendRes.messageId,
              status: "sent",
              timestamp: new Date(),
            });
            conversation.lastMessageAt = new Date();
            await conversation.save();
          }
        }
      }

      // Action: Update Contact Custom Field
      else if (action.type === "update_contact_field") {
        const fieldName = action.payload?.field;
        let fieldValue = action.payload?.value;

        if (fieldName && contact) {
          fieldValue = interpolateVariables(fieldValue, contact, context);
          if (!contact.customFields) contact.customFields = {};
          contact.customFields[fieldName] = fieldValue;
          contact.markModified("customFields");
          await contact.save();
          console.log(`[AUTOMATION_ACTION] Updated contact ${contact._id} field ${fieldName}=${fieldValue}`);
        }
      }

      // Action: Condition (IF / THEN / ELSE)
      else if (action.type === "condition") {
        const isTrue = evaluateCondition(action.payload?.condition, contact, context);
        const nextBranchActions = isTrue ? action.payload?.thenActions : action.payload?.elseActions;
        if (Array.isArray(nextBranchActions) && nextBranchActions.length > 0) {
          actionsToExecute.unshift(...nextBranchActions);
        }
      }

      // Action: Wait
      else if (action.type === "wait") {
        const seconds = Math.min(Math.max(parseInt(action.payload?.seconds, 10) || 1, 1), 10);
        await new Promise((res) => setTimeout(res, seconds * 1000));
      }

      // Action: End Automation
      else if (action.type === "end_automation") {
        break;
      }
    }

    runDoc.status = "success";
    runDoc.stepsExecuted = stepsCount;
    await runDoc.save();
  } catch (runErr: unknown) {
    console.error(`[AUTOMATION_ERROR] Run failed for rule ${matchedAutomation.name}:`, runErr);
    runDoc.status = "failed";
    runDoc.stepsExecuted = stepsCount;
    runDoc.error = (runErr as Error).message;
    await runDoc.save();
  }
}
