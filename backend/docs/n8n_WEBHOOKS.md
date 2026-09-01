# n8n Webhooks Integration

This project uses n8n workflows for automated notifications, assignments, and reporting. 

The webhooks are categorized into two types: **Event-Driven** (triggered by our Node.js backend) and **Independent / Scheduled** (triggered automatically by n8n on a schedule).

## 1. Event-Driven Webhooks (Triggered via Backend APIs)
These webhooks are called asynchronously ("fire-and-forget") from `complaintController.js` and do not block the main application execution.

* **Complaint Acknowledgment (`/webhook/complaint-ack`)**
  * **When it fires:** Immediately after a new complaint is filed and saved successfully.
  * **Payload:** `event`, `email`, `complaint_id`, `subject`, `message`, `status`, `user_id`, `municipality`
  * **Purpose:** Triggers n8n to send a confirmation/acknowledgment message to the user who reported the issue.

* **Employee Assignment (`/webhook/employee-assign`)**
  * **When it fires:** 
    1. During complaint creation, if the complaint is automatically assigned.
    2. During a complaint update, if the `assigned_to` field is manually updated or changed.
  * **Payload:** `event`, `complaint_id`, `assigned_employee_id`, `status`
  * **Purpose:** Notifies the designated employee (via n8n) that a new complaint has been assigned to them.

## 2. Independent / Auto-Triggered Webhooks (Handled Entirely in n8n)
These workflows run independently of the main API logic (triggering on their own schedules inside n8n) and poll our database or expose their own entrypoints.

* **WF3 – CivicMind SLA Breach Alert**
  * **How it works:** A scheduled n8n trigger (e.g., cron node running daily) checks for complaints that have surpassed their Service Level Agreement (SLA) time limits without being resolved.
  * **Purpose:** Automatically alerts administrators or managers when a complaint resolution is overdue.

* **WF4 – CivicMind Weekly Admin Report**
  * **How it works:** A scheduled n8n trigger generates a summary report at the end of every week.
  * **Purpose:** Aggregates data on all complaints filed, resolved, and pending to provide a high-level weekly summary to administrators.
