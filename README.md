# Supermarket Ops Agent

A Telegram-only AI operations agent for running an Indian kirana/supermarket.

## Live Demo

**Telegram Bot:** `@Kirana_Ops_Agent_Bot`

The agent supports inventory management, multi-turn billing, GST invoices, payments, Khata credit, sales analytics, and owner preferences.

---

## Architecture

```text
Telegram
    ↓
LLM Agent
    ↓
Gemini (Primary)
    ↓ if quota/error
Groq (Fallback)
    ↓ if error
OpenRouter (Fallback)
    ↓
Tool Calling
    ↓
SQLite Database
    ↓
Inventory / Billing / Khata / Analytics
    ↓
PDF Invoice / PPTX Analysis Deck
```

The system uses **LLM-driven tool orchestration** instead of a regex-based intent router.

The LLM receives the user's message and available tools, selects the required tool, observes the result, and continues until the task is complete.

---
## LLM Provider Strategy

The agent uses a multi-provider fallback architecture to improve
availability and reduce dependency on a single LLM provider.

```text
User Message
     ↓
Gemini
     │
     ├── Success → Continue
     │
     └── Error / Rate Limit
              ↓
            Groq
              │
              ├── Success → Continue
              │
              └── Error
                    ↓
                OpenRouter
```
---

## Features

### Inventory Management

* Search products
* Check stock
* Receive stock
* Low-stock queries
* Product price and GST handling
* Overselling protection
* Stock is reduced only when a bill is finalized

Example:

```text
Owner: how much sugar is left?

Agent:
1. Searches for Sugar
2. Gets the product ID
3. Checks stock
4. Returns the current stock
```

### Multi-Turn Billing

Bills are created as drafts and can be edited before finalization.

Supported operations:

* Create bill
* Add products
* Update quantities
* Remove products
* GST calculation
* Cash / UPI / Card payments
* Finalize bill
* Generate PDF invoice

Example:

```text
Owner: make a bill for 2kg sugar and 4 Maggi

Agent: Draft bill created.

Owner: add 1 Parle-G

Agent: Parle-G added.

Owner: remove Maggi

Agent: Maggi removed.

Owner: finalize with UPI

Agent: Bill finalized.
```

Draft bill edits do **not** reduce inventory.

Inventory is reduced only when the bill is successfully finalized.

---

## Billing Safety

The system protects the store from overselling.

During bill finalization, stock is updated using a database quantity guard:

```sql
UPDATE products
SET quantity = quantity - ?
WHERE id = ?
AND quantity >= ?;
```

This ensures that a bill cannot finalize when sufficient stock is unavailable.

Bill finalization also supports idempotency to prevent duplicate completed bills.

---

## GST and Money Handling

All monetary values are stored internally as **integer paise**.

Examples:

```text
₹100.50 → 10050 paise
₹570.24 → 57024 paise
```

Using integer paise avoids floating-point currency calculation problems.

GST calculations use the GST rate stored for each product.

Generated invoices contain:

* Invoice number
* Date
* Product
* Quantity
* Unit price
* Taxable amount
* CGST
* SGST
* Total amount
* Payment mode
* Payment reference

---

## Khata / Credit Ledger

The agent supports customer credit management.

Operations include:

* Find customer
* Create customer
* Add credit
* Record payment
* Check customer balance
* View credit history

Example:

```text
Owner: Ramesh bought goods on credit for ₹300

Agent: Credit recorded.

Owner: Ramesh paid ₹200

Agent: Payment recorded.

Owner: what is Ramesh's balance?

Agent: ₹100 outstanding.
```

---

## Sales Analytics

The agent provides:

* Daily sales
* Top-selling products
* GST summary
* Stock health
* Weekly sales summary

Example:

```text
Owner: show today's sales

Agent:
1. Retrieves sales data from SQLite
2. Calculates the summary
3. Returns the result
```

---

## PDF Invoice

After a bill is finalized, the agent can generate a GST invoice as a PDF.

Example:

```text
Owner: send me that bill as a PDF

Agent
   ↓
get_last_finalized_bill
   ↓
generate_invoice
   ↓
PDF sent through Telegram
```

The invoice uses Unicode-compatible fonts so Indian Rupee values are displayed correctly.

---

## Weekly Analysis Deck

The system can generate a PPTX weekly sales analysis deck.

The presentation can include:

* Sales trend
* Top products
* GST summary
* Stock information
* Charts

The deck is generated from database analytics rather than hard-coded values.

---

## Owner Preferences

Owner preferences are stored in SQLite and are separate from temporary conversation context.

Example:

```text
Owner: I prefer UPI for normal bills.

Agent: Preference saved.

Owner: /new

Owner: make a bill for 2kg sugar

Agent: Uses the stored preference when appropriate.
```

The `/new` command clears the current conversation context, while stored preferences remain available from the database.

---

## Agent Control Loop

```text
User message
     ↓
LLM receives message + conversation context + tools
     ↓
LLM selects required tool
     ↓
Tool executes against SQLite
     ↓
Tool result returned to LLM
     ↓
LLM decides whether another tool is required
     ↓
Final response or generated document
```

The database is the source of truth for:

* Products
* Stock
* Bills
* Customers
* Credit transactions
* Owner preferences

---

## Guardrails

The agent follows important business rules:

* Never invent products, prices, stock, customers, or bills
* Search for unknown products before billing
* Ask for clarification when multiple products match
* Draft bill edits do not reduce stock
* Stock is reduced only after successful finalization
* Finalization requires explicit confirmation
* Overselling is blocked at the database level
* Payment references are stored only when actually supplied
* Money is stored as integer paise
* GST is calculated using stored product GST rates
* Bill finalization is idempotent
* SQLite foreign keys are enabled
* SQLite WAL mode is enabled

---

## Technology Stack

* Node.js
* JavaScript
* Google Gemini
* Groq
* OpenRouter
* LLM Tool Calling
* Telegram Bot API
* SQLite
* better-sqlite3
* PDFKit
* PptxGenJS
* dotenv
* Git
* GitHub
* Railway

---

## Project Structure

```text
supermarket-ops-agent/
│
├── src/
│   ├── agent/
│   │   ├── agent.js
│   │   ├── openaiAgent.js
│   │   ├── toolDefinitions.js
│   │   ├── tools.js
│   │   └── mcpServer.js
│   │
│   ├── db/
│   │   ├── database.js
│   │   ├── schema.js
│   │   └── seed.js
│   │
│   ├── tools/
│   │   ├── analytics.js
│   │   ├── billing.js
│   │   ├── inventory.js
│   │   ├── khata.js
│   │   ├── preferences.js
│   │   └── documents/
│   │       ├── invoicePdf.js
│   │       └── salesDeck.js
│   │
│   ├── utils/
│   │   ├── analyticsFormatter.js
│   │   ├── gst.js
│   │   └── money.js
│   │
│   └── telegram.js
│
├── fonts/
│   └── DejaVuSans.ttf
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone <your-private-repository-url>
cd supermarket-ops-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```text
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

Do not commit the `.env` file.

### 4. Start the application

```bash
npm start
```

The application automatically:

1. Initializes the SQLite database
2. Creates the required tables
3. Seeds demo products
4. Starts the Telegram bot

For development:

```bash
npm run dev
```

---

## Example Demo Flow

```text
Owner: how much sugar is left?

Owner: 50 Maggi came in, cost ₹12, MRP ₹14

Owner: make a bill for 2kg sugar and 4 Maggi

Owner: add 1 Parle-G

Owner: remove Maggi

Owner: finalize with UPI

Owner: send me that bill as a PDF

Owner: Ramesh bought goods on credit for ₹300

Owner: Ramesh paid ₹200

Owner: what is Ramesh's balance?

Owner: show today's sales

Owner: make this week's sales analysis deck

Owner: I prefer UPI for normal bills

Owner: /new
```

---

## Deployment

The Telegram bot is deployed as a Node.js service on Railway.

The service runs:

```bash
npm start
```

Environment variables are configured in the deployment environment and are not committed to the repository.

---

## Engineering Decisions

### LLM-First Orchestration

The agent uses LLM-driven tool orchestration instead of a regex-based intent router.

Gemini is used as the primary LLM provider. If Gemini is unavailable
or rate-limited, the agent falls back to Groq and then OpenRouter.

The selected LLM receives the user's message and available tools,
selects the required tool, observes the result, and continues until
the task is complete.

### Tool-Based Database Access

Operational information comes from database-backed tools rather than being invented by the model.

### Draft Billing

Bills remain editable drafts until the owner explicitly confirms finalization.

### Atomic Stock Updates

Stock is decremented only during finalization using a database quantity guard.

### Integer Currency

Money is stored as integer paise to avoid floating-point currency errors.

### Idempotent Finalization

Bill finalization prevents accidental duplicate completed transactions.

### Generated Documents

PDF invoices and PPTX analysis reports are generated from actual database data.

### Stored Preferences

Owner preferences are stored in SQLite so they can be reused across new conversations.

---

## Hiring Assignment

This project was built as a take-home engineering assignment for **Nebula KnowLab**.

The implementation demonstrates:

* Agentic tool orchestration
* Stateful multi-turn interaction
* Database-backed business operations
* Inventory safety
* Financial correctness
* GST calculation
* Credit ledger management
* Document generation
* Owner preferences
* Telegram-first UX
* Production deployment
