\# Supermarket Ops Agent



A Telegram-only AI operations agent for running an Indian kirana/supermarket.



\## Live Demo



\*\*Telegram Bot:\*\* `@Kirana\_Ops\_Agent\_Bot`



The agent supports inventory management, multi-turn billing, GST invoices, payments, Khata credit, sales analytics, and persistent owner preferences.



\---



\## Architecture



```text

Telegram

&#x20;   ↓

LLM Agent (OpenRouter)

&#x20;   ↓

Tool Calling

&#x20;   ↓

SQLite Database

&#x20;   ↓

Inventory / Billing / Khata / Analytics

&#x20;   ↓

PDF Invoice / PPTX Analysis Deck

```



The system uses \*\*LLM-driven tool orchestration\*\* rather than a regex-based intent router.



The model receives the user's message and available tools, selects the required tool, observes the result, and continues until the task is complete.



\---



\## Core Features



\### 1. Inventory Management



\* Search products

\* Check product stock

\* Receive new stock

\* Low-stock queries

\* Overselling protection

\* Product price and GST handling

\* Stock is reduced only when a bill is finalized



Example:



```text

Owner: how much sugar is left?



Agent: searches for Sugar

&#x20;     ↓

&#x20;     gets the product ID

&#x20;     ↓

&#x20;     checks stock

&#x20;     ↓

&#x20;     returns current quantity

```



\---



\### 2. Multi-Turn Billing



Bills are created as drafts and can be edited before finalization.



Supported operations:



\* Create bill

\* Add products

\* Change quantity

\* Remove products

\* Calculate GST

\* Cash / UPI / Card payments

\* Finalize bill

\* Generate invoice



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



Draft edits \*\*do not reduce inventory\*\*.



Inventory is reduced only during successful finalization.



\---



\## Billing Safety



The system includes database-level protection against overselling.



During finalization, stock is updated using a quantity guard:



```sql

UPDATE products

SET quantity = quantity - ?

WHERE id = ?

AND quantity >= ?

```



Therefore, a bill cannot successfully finalize if sufficient stock is unavailable.



Finalization also supports idempotency to prevent duplicate completed bills.



\---



\## GST and Money Handling



All monetary values are stored internally as \*\*integer paise\*\*.



Example:



```text

₹100.50 → 10050 paise

₹570.24 → 57024 paise

```



This avoids floating-point currency calculation problems.



GST calculations use the GST rate stored for each product.



The generated invoice contains:



\* Invoice number

\* Date

\* Product

\* Quantity

\* Unit price

\* Taxable amount

\* CGST

\* SGST

\* Total amount

\* Payment mode

\* Payment reference



\---



\## Khata / Credit Ledger



The agent supports customer credit management.



Operations include:



\* Find customer

\* Create customer

\* Add credit

\* Record payment

\* Check outstanding balance

\* View credit history



Example:



```text

Owner: Ramesh bought goods on credit for ₹300



Agent: Credit recorded.



Owner: Ramesh paid ₹200



Agent: Payment recorded.



Owner: what is Ramesh's balance?



Agent: ₹100 outstanding.

```



\---



\## Sales Analytics



The agent can provide:



\* Daily sales

\* Top-selling products

\* GST summary

\* Stock health

\* Weekly sales summary



Example:



```text

Owner: show today's sales



Agent: retrieves sales data from SQLite

&#x20;     ↓

&#x20;     calculates summary

&#x20;     ↓

&#x20;     returns the result

```



\---



\## PDF Invoice



After a bill is finalized, the agent can generate a GST invoice as a PDF.



Example:



```text

Owner: send me that bill as a PDF



Agent:

&#x20;   ↓

get\_last\_finalized\_bill

&#x20;   ↓

generate\_invoice

&#x20;   ↓

PDF sent through Telegram

```



\---



\## Weekly Analysis Deck



The system can generate a PPTX weekly sales analysis deck.



The deck contains information such as:



\* Sales trend

\* Top products

\* GST summary

\* Stock information

\* Charts



The presentation is generated from database analytics rather than hard-coded values.



\---



\## Persistent Owner Preferences



Owner preferences are stored in SQLite rather than only in conversation memory.



Example:



```text

Owner: I prefer UPI for normal bills.



Agent: Preference saved.



Owner: /new



Owner: make a bill for 2kg sugar



Agent: uses the stored preference when appropriate.

```



`/new` clears the current conversation context, but stored preferences remain in the database.



\---



\## Agent Control Loop



```text

User message

&#x20;    ↓

LLM receives message + conversation context + tools

&#x20;    ↓

LLM selects required tool

&#x20;    ↓

Tool executes against SQLite

&#x20;    ↓

Tool result returned to LLM

&#x20;    ↓

LLM decides whether another tool is required

&#x20;    ↓

Final response or generated document

```



The \*\*database is the source of truth\*\* for:



\* Products

\* Stock

\* Bills

\* Customers

\* Credit transactions

\* Preferences



\---



\## Important Guardrails



The agent follows these rules:



\* Never invent products, prices, stock, customers, or bills

\* Search for unknown products before billing

\* Ask for clarification when multiple products match

\* Draft bill edits do not reduce stock

\* Stock is reduced only after finalization

\* Finalization requires explicit confirmation

\* Overselling is blocked at the database level

\* Payment references are stored only when actually supplied

\* Money is stored as integer paise

\* GST is calculated from product GST rates

\* Bill finalization is idempotent

\* Database foreign keys are enabled

\* SQLite WAL mode is enabled



\---



\## Technology Stack



\* \*\*Node.js\*\*

\* \*\*JavaScript\*\*

\* \*\*OpenRouter / LLM Tool Calling\*\*

\* \*\*Telegram Bot API\*\*

\* \*\*SQLite\*\*

\* \*\*better-sqlite3\*\*

\* \*\*PDFKit\*\*

\* \*\*PptxGenJS\*\*

\* \*\*dotenv\*\*

\* \*\*Git / GitHub\*\*

\* \*\*Railway\*\*



\---



\## Project Structure



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

├── .env

├── .gitignore

├── package.json

├── package-lock.json

└── README.md

```



\---



\## Running Locally



\### 1. Install dependencies



```bash

npm install

```



\### 2. Configure environment variables



Create a `.env` file:



```text

TELEGRAM\_BOT\_TOKEN=your\_telegram\_bot\_token

OPENROUTER\_API\_KEY=your\_openrouter\_api\_key

GEMINI\_API\_KEY=your\_gemini\_api\_key

```



\### 3. Start the bot



```bash

npm start

```



The application automatically:



1\. Initializes the SQLite database

2\. Creates the required tables

3\. Seeds demo products

4\. Starts the Telegram polling process



Development mode:



```bash

npm run dev

```



\---



\## Example Demo Commands



```text

how much sugar is left?



50 Maggi came in, cost ₹12, MRP ₹14



make a bill: 2kg sugar, 4 Maggi, UPI



add 1 Parle-G



remove Maggi



finalize with UPI



send me that bill as a PDF



Ramesh paid ₹300



what is Ramesh's balance?



show today's sales



make this week's sales analysis deck



I prefer UPI for normal bills



/new

```



\---



\## Deployment



The Telegram bot is deployed as a Node.js service on Railway.



Environment variables are configured through the deployment platform and are not committed to the repository.



The service runs the Telegram polling process using:



```bash

npm start

```



\---



\## Engineering Decisions



\### LLM-first orchestration



No regex-based intent router is used.



The LLM decides which operation is required and calls the appropriate tool.



\### Tool-based database access



The agent does not directly invent operational information. Database-backed tools provide the source of truth.



\### Draft billing



Bills remain editable drafts until explicit finalization.



\### Atomic stock updates



Stock decrement occurs during finalization with a database quantity guard.



\### Integer currency



Money is represented internally in paise to avoid floating-point errors.



\### Idempotent finalization



Finalization prevents accidental duplicate completed bills.



\### Generated artifacts



PDF invoices and PPTX analysis reports are generated from actual database data.



\### Stored preferences



Owner preferences are stored in SQLite so they can be reused across new conversations.



\---



\## Hiring Assignment



This project was built as a take-home engineering assignment for \*\*Nebula KnowLab\*\*.



The implementation demonstrates:



\* Agentic tool orchestration

\* Multi-turn stateful interaction

\* Database-backed business operations

\* Inventory safety

\* Financial correctness

\* GST calculation

\* Credit ledger management

\* Document generation

\* Persistent preferences

\* Telegram-first user experience

\* Production deployment



