# 🏛️ ميزان ERP | MIZAN ERP
### نظام إدارة المؤسسات المعياري لسطح المكتب (Local-First Modular Desktop ERP)

[![Release](https://img.shields.io/badge/Release-v0.6--phase6-blue.svg)](https://github.com/Omar-b381/MIZAN-ERP/releases)
[![Rust](https://img.shields.io/badge/Rust-1.85%2B-orange.svg?logo=rust)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2.1-24C8D5.svg?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://reactjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-54%2F54%20Passing-brightgreen.svg)]()

> **"نظام محلي، معياري، فائق السرعة، ومصمم خصيصًا لتلبية متطلبات الشركات والمؤسسات في مصر والشرق الأوسط بدقة رياضية ومحاسبية مطلقة."**

---

## 📑 جدول المحتويات (Table of Contents)

1. [نظرة عامة على المشروع (Project Description)](#-نظرة-عامة-على-المشروع-project-description)
2. [المشكلة التي يعالجها النظام (Problem It Solves)](#-المشكلة-التي-يعالجها-النظام-problem-it-solves)
3. [البنية الهندسية والتقنيات (Tech Stack & Architecture)](#-البنية-الهندسية-والتقنيات-tech-stack--architecture)
4. [مخططات دورات العمل المتكاملة (Business Cycles & Diagrams)](#-مخططات-دورات-العمل-المتكاملة-business-cycles--workflow-diagrams)
   - [4.1 النظرة الشاملة لدورات العمل (End-to-End Enterprise Flow)](#41-النظرة-الشاملة-لدورات-العمل-المترابطة-end-to-end-enterprise-flow)
   - [4.2 دورة المبيعات والتحصيل (Order to Cash Cycle)](#42-دورة-المبيعات-والتسليم-والتحصيل-order-to-cash---o2c)
   - [4.3 دورة المشتريات والسداد (Procure to Pay Cycle)](#43-دورة-المشتريات-والاستلام-وسداد-الموردين-procure-to-pay---p2p)
   - [4.4 دورة حركة المخزون المزدوج (Double-Entry Inventory Moves)](#44-دورة-حركة-المخزون-بالقيد-المزدوج-double-entry-stock-moves)
   - [4.5 دورة القيود المحاسبية وميزان المراجعة (General Ledger)](#45-دورة-القيود-المحاسبية-المزدوجة-وميزان-المراجعة-general-ledger)
   - [4.6 دورة الموارد البشرية (HR Management Cycle)](#46-دورة-الموارد-البشرية-وإدارة-الموظفين-human-resources-management)
5. [المراحل والقدرات المنجزة (Features & Milestones)](#-المراحل-والقدرات-المنجزة-features--milestones)
6. [التحديات الهندسية والحلول (Challenges & Solutions)](#-التحديات-الهندسية-والحلول-challenges--solutions)
7. [دليل التثبيت والتشغيل (Getting Started)](#-دليل-التثبيت-والتشغيل-getting-started)
8. [خارطة الطريق والمراحل (Roadmap & Status)](#-القيود-وخارطة-الطريق-المستقبلية-limitations--roadmap)
9. [الترخيص والمصادر (Credits & License)](#-الترخيص-والمصادر-المرجعية-credits--license)

---

## 🌟 نظرة عامة على المشروع (Project Description)

**ميزان ERP** هو تطبيق سطح مكتب محلي من الجيل التالي (Native Desktop Application) لإدارة موارد المؤسسات (ERP). تم بناؤه من الصفر باستخدام لغة **Rust** كطبقة خلفية فائقة الأداء ونظام **SQLite** في وضع الذاكرة المزامنة (WAL Mode)، ومغلف عبر إطار عمل **Tauri v2** مع واجهة أمامية حديثة مبنية بـ **React & TypeScript**.

يهدف المشروع إلى توفير بديل قوي، آمن، وخفيف الوزن لأنظمة ERP السحابية البطيئة والمكلفة، مع التركيز على **الخصوصية التامة للبيانات (Local-First)**، ودعم كامل للغة العربية والاتجاه من اليمين لليسار (RTL-First)، والتوافق الكامل مع متطلبات السوق المصري (الجنيه المصري، ضريبة القيمة المضافة 14%، دليل الحسابات المصري الموحد، والتوقيت الإقليمي).

---

## 🎯 المشكلة التي يعالجها النظام (Problem It Solves)

تعاني الشركات الصغيرة والمتوسطة (SMEs) عند اختيار وتطبيق أنظمة الـ ERP التقليدية من عدة مشاكل حرجة:

1. **تكاليف الاشتراكات السحابية الباهظة والارتهان للموردين (Vendor Lock-in)**: تتطلب معظم الأنظمة اشتراكات شهرية متكررة ترهق ميزانيات الشركات.
2. **بطء الأداء والاعتماد الدائم على الإنترنت**: يؤدي انقطاع الإنترنت أو بطء استجابة الخوادم السحابية إلى شلل كامل في عمليات البيع، التخزين، إصدار الفواتير، والتحصيل.
3. **أخطاء التقريب الحسابي (Floating-Point Inaccuracies)**: استخدام الأرقام العشرية العائمة في تمثيل النقود والكميات يؤدي لتراكم فروقات مالية ومخزنية غير مبررة عبر الزمن.
4. **عدم انضباط القيود المزدوجة (Broken Ledger Invariants)**: غياب الرقابة الصارمة في بعض الأنظمة يسمح بتوليد قيود محاسبية أو مخزنية غير متوازنة.
5. **ضعف التوطين الإقليمي (Localization & Compliance)**: عدم جاهزية معظم الأنظمة العالمية لتفاصيل السوق العربي والمصري وضريبة القيمة المضافة بطريقة سلسة.

---

## 🛠️ البنية الهندسية والتقنيات (Tech Stack & Architecture)

```mermaid
graph TD
    UI["Desktop UI (React 18 + TypeScript + Tailwind)"] -->|Tauri v2 IPC Bridge| Engine["Native Rust Core Engine (Rust 1.85+)"]
    Engine --> Auth["Auth & Multi-Company RBAC Matrix"]
    Engine --> Stock["Double-Entry Stock Movement Engine"]
    Engine --> Sales["Sales Order & Quotation Lifecycle"]
    Engine --> Purchases["Procurement & Vendor Orders Engine"]
    Engine --> GL["General Ledger (SUM(Debit) == SUM(Credit))"]
    Engine --> HR["HR, Contracts & Attendance Module"]
    Auth & Stock & Sales & Purchases & GL & HR -->|Async SQLx Transactions| DB[("SQLite Database (WAL Mode / ACID Compliant)")]
```

---

## 🔄 مخططات دورات العمل المتكاملة (Business Cycles & Workflow Diagrams)

### 4.1 النظرة الشاملة لدورات العمل المترابطة (End-to-End Enterprise Flow)

يوضح المخطط التالي كيف تترابط كافة وحدات النظام (المبيعات، المشتريات، المخازن، الحسابات، والخزينة) في تدفق متجانس ومحكم رياضياً:

```mermaid
flowchart TD
    subgraph Procurement ["دورة المشتريات (Procure to Pay)"]
        PO["أمر شراء معتمد (Purchase Order)"]
        REC["إذن استلام مخزني وارد (WH/IN)"]
        BILL["فاتورة مورد (Vendor Bill)"]
        PAY_OUT["سند صرف نقدي / بنكي (Outbound Payment)"]
        PO -->|Trigger| REC
        PO -->|Billing| BILL
        BILL -->|Settlement| PAY_OUT
    end

    subgraph Inventory ["محرك المخزون بالقيد المزدوج"]
        LOC_VEND["موقع المورد (Vendor Location)"]
        LOC_STOCK["مستودع البضائع الداخلي (Stock)"]
        LOC_CUST["موقع العميل (Customer Location)"]
        REC -->|Stock Move| MoveIN["حركة واردة: من المورد -> المخزن"]
        MoveIN --> LOC_STOCK
        MoveOUT["حركة صادرة: من المخزن -> العميل"] --> LOC_CUST
    end

    subgraph Sales ["دورة المبيعات (Order to Cash)"]
        SO["أمر بيع معتمد (Sales Order)"]
        DEL["إذن صرف وتسليم مخزني (WH/OUT)"]
        INV["فاتورة مبيعات عميل (Customer Invoice)"]
        PAY_IN["سند قبض نقدي / بنكي (Inbound Receipt)"]
        SO -->|Trigger| DEL
        DEL -->|Stock Move| MoveOUT
        SO -->|Invoicing| INV
        INV -->|Settlement| PAY_IN
    end

    subgraph Finance ["دفتر الأستاذ العام (General Ledger)"]
        AR["حسابات القبض والعملاء (1030)"]
        AP["حسابات الدفع والموردين (2010)"]
        VAT_OUT["ضريبة مخرجات 14% (2020)"]
        VAT_IN["ضريبة مدخلات 14% (2025)"]
        CASH_BNK["الخزينة والبنوك (1010 / 1020)"]
        TB["ميزان المراجعة الحي (Trial Balance)"]
        
        INV -->|Post Move| AR & VAT_OUT
        BILL -->|Post Move| AP & VAT_IN
        PAY_IN -->|Reconcile| CASH_BNK & AR
        PAY_OUT -->|Reconcile| AP & CASH_BNK
        AR & AP & VAT_OUT & VAT_IN & CASH_BNK --> TB
    end
```

---

### 4.2 دورة المبيعات والتسليم والتحصيل (Order to Cash - O2C)

مخطط الحالة لتطور عروض الأسعار إلى أوامر بيع، وتوليد أذون الصرف الآلية، وإصدار الفواتير مع ضريبة القيمة المضافة 14%:

```mermaid
stateDiagram-v2
    [*] --> Draft_Quotation: إنشاء مسودة عرض سعر (Draft Quotation)
    Draft_Quotation --> Sent: إرسال عرض السعر للعميل (Sent)
    Sent --> Sale_Order: اعتماد أمر البيع (Confirm Sale Order)
    Draft_Quotation --> Sale_Order: تأكيد مباشر
    
    state Sale_Order {
        [*] --> WH_OUT_Triggered: توليد إذن الصرف والتسليم تلقائيًا (WH/OUT/xxxxx)
        WH_OUT_Triggered --> Stock_Reserved: حجز الأصناف وتوليد حركات Stock Moves
        Stock_Reserved --> Delivered: اعتماد خروج البضاعة وتسليمها للعميل
    }
    
    Sale_Order --> Customer_Invoice: إنشاء فاتورة مبيعات (Customer Invoice)
    
    state Customer_Invoice {
        [*] --> Compute_VAT: حساب الضريبة 14% والخصومات
        Compute_VAT --> Post_Invoice: ترحيل القيد (Debit A/R, Credit Sales, Credit VAT)
        Post_Invoice --> Register_Payment: تسجيل سند قبض نقدية / بنك
        Register_Payment --> Paid: مدفوعة بالكامل وتسوية الذمة (Reconciled)
    }
    
    Customer_Invoice --> Reversed: عكس القيد / إشعار دائن (Reverse Move)
    Sale_Order --> Cancelled: إلغاء الأمر وإلغاء إذن التسليم المرتبط
    Cancelled --> [*]
    Paid --> [*]
    Reversed --> [*]
```

---

### 4.3 دورة المشتريات والاستلام وسداد الموردين (Procure to Pay - P2P)

توضح دورة المشتريات انتقال طلبات الأسعار لأوامر شراء وتوليد أذون الاستلام المخزني الوارد وسداد مستحقات المورد:

```mermaid
sequenceDiagram
    autonumber
    actor Purchasing as مسؤول المشتريات
    participant System as نظام ميزان ERP
    participant Warehouse as قسم المستودعات
    actor Vendor as المورد
    participant GL as دفتر الحسابات العامة

    Purchasing->>System: إنشاء طلب عرض أسعار RFQ
    Purchasing->>Vendor: إرسال طلب عرض الأسعار (State: Sent)
    Vendor-->>Purchasing: الموافقة على الأسعار والكميات
    Purchasing->>System: تأكيد أمر الشراء (Confirm Purchase Order)
    Note over System: الانتقال لحالة 'purchase'
    System->>Warehouse: إنشاء إذن استلام بضائع آلي (WH/IN/xxxxx)
    Vendor->>Warehouse: توريد البضاعة للمستودع
    Warehouse->>System: تأكيد استلام الشحنة وتحديث الرصيد الفعلي
    Note over System: نقل البضائع من موقع المورد إلى المخزن الداخلي
    Purchasing->>System: إنشاء وترحيل فاتورة المورد (Vendor Bill)
    System->>GL: تسجيل القيد: Debit Expense/Purchases + Debit VAT Input, Credit A/P
    Purchasing->>System: تسجيل سند صرف وسداد المورد (Outbound Payment)
    System->>GL: تسجيل قيد السداد: Debit A/P, Credit Cash/Bank
    Note over System: تسوية الفاتورة وتحديث حالتها إلى 'Paid'
```

---

### 4.4 دورة حركة المخزون بالقيد المزدوج (Double-Entry Stock Moves)

يوضح هذا النموذج كيف لا يتم تعديل أي رصيد مخزني بصورة مفردة، بل يتم دومًا عبر حركة بين موقعين محددين (موقع مصدر وموقع وجهة):

```mermaid
flowchart LR
    subgraph Virtual_Sources ["مواقع افتراضية ومصادر"]
        V_Suppliers["مواقع الموردين (Partner Locations/Vendors)"]
        V_InvLoss["مواقع فروقات الجرد والتلف (Inventory Loss)"]
        V_Production["مواقع خطوط الإنتاج (Production)"]
    end

    subgraph Internal_Warehouses ["المستودعات والمواقع الداخلية"]
        WH_Stock["المستودع الرئيسي (WH/Stock)"]
        WH_ShelfA["الرف A (WH/Stock/Shelf A)"]
        WH_ShelfB["الرف B (WH/Stock/Shelf B)"]
    end

    subgraph Virtual_Destinations ["مواقع افتراضية ووجهات"]
        V_Customers["مواقع العملاء (Partner Locations/Customers)"]
        V_Scrap["موقع الخردة والهالك (Scrap)"]
    end

    V_Suppliers -->|إذن استلام WH/IN| WH_Stock
    WH_Stock <-->|تحويل داخلي WH/INT| WH_ShelfA & WH_ShelfB
    WH_Stock -->|إذن صرف وتسليم WH/OUT| V_Customers
    WH_Stock <-->|جلسة جرد فعلي Physical Inventory| V_InvLoss
    WH_Stock -->|إتلاف صنف معيب| V_Scrap
```

---

### 4.5 دورة القيود المحاسبية المزدوجة وميزان المراجعة (General Ledger)

مخطط يوضح المعالجة المحاسبية الصارمة؛ حيث لا يُرحل قيد إلا بتحقيق التوازن `SUM(Debit) == SUM(Credit)`:

```mermaid
flowchart TD
    subgraph Transaction_Sources ["مصادر المعاملات والعمليات"]
        T1["فاتورة مبيعات عميل (INV)"]
        T2["فاتورة مشتريات مورد (BILL)"]
        T3["سند قبض / صرف (PAY)"]
        T4["قيد تسوية يدوي (MISC)"]
    end

    subgraph Validation ["محرك التحقق والترحيل (Strict Invariant)"]
        Engine{"هل إجمالي المدين == إجمالي الدائن؟"}
        Reject["رفض الترحيل وتنبيه المستخدم بخطأ التوازن"]
        Post["اعتماد القيد وتغيير الحالة إلى Posted"]
    end

    subgraph Chart_Of_Accounts ["دليل الحسابات المصري الموحد (COA)"]
        Assets["1000 - الأصول (خزينة، بنوك، عملاء، مخزون)"]
        Liabilities["2000 - الخصوم (موردون، ضرائب مبيعات ومشتريات)"]
        Equity["3000 - حقوق الملكية (رأس المال، أرباح مبقاة)"]
        Revenue["4000 - الإيرادات (إيرادات المبيعات)"]
        Expenses["5000 - المصروفات (تكلفة البضاعة المباعة، عمومية)"]
    end

    subgraph Reporting ["التقارير والمخرجات المالية"]
        TB["ميزان المراجعة اللحظي (Trial Balance)"]
        IS["قائمة الدخل والأرباح والخسائر"]
        BS["الميزانية العمومية والمركز المالي"]
    end

    T1 & T2 & T3 & T4 --> Engine
    Engine -->|لا| Reject
    Engine -->|نعم| Post
    Post --> Assets & Liabilities & Equity & Revenue & Expenses
    Assets & Liabilities & Equity & Revenue & Expenses --> TB
    TB --> IS & BS
```

---

### 4.6 دورة الموارد البشرية وإدارة الموظفين (Human Resources Management)

مخطط سير العمل لوحدة الموارد البشرية (Phase 6):

```mermaid
flowchart LR
    Recruit["دليل الموظفين والهيكل الإداري"] --> Contract["عقود العمل والرواتب"]
    Contract --> Track["تتبع الحضور وساعات العمل (Timesheets)"]
    Contract --> Leave["طلبات الإجازات والعطلات (Time-Off)"]
    Track & Leave --> PayrollCalc["احتساب الاستحقاقات والخصومات"]
    PayrollCalc --> GL_Post["ترحيل قيود الرواتب إلى الحسابات العامة"]
```

---

## 📦 المراحل والقدرات المنجزة (Features & Milestones)

### المرحلة 0: النواة التأسيسية (Phase 0 — Foundation) ✅
- بنية Tauri + React + Vite + MinGW Toolchain.
- محرك SQLite في وضع WAL مع نظام الهجرات الآلية (Migrations Engine).
- مدير الوحدات البرمجية المعياري (Modular Feature Flags).

### المرحلة 1: الهيكل الإداري والأمان (Phase 1 — Core & RBAC) ✅
- **تعدد الشركات والفروع (Multi-Company / Branches)**: هيكل هرمي مرن يتيح إدارة الشركة القابضة وفروعها مع تخصيص العملة والمنطقة الزمنية لكل فرع.
- **المصادقة والأدوار (Authentication & RBAC)**:
  - تشفير آمن لكلمات المرور بخوارزمية Salted SHA-256.
  - مصفوفة صلاحيات تفصيلية (Permissions Matrix) تغطي كل عملية وعرض.
- **دليل جهات الاتصال الموحد (Unified Partners Directory)**:
  - سجل موحد للعملاء، الموردين، والشركاء مع التمييز بين الشركات والأفراد.
  - دعم الأرقام الضريبية، السجلات التجارية، الحدود الائتمانية، والعناوين المفصلة.
- **سجل النشاط والمحادثات (Chatter & Audit Trail)**: توثيق غير قابل للحذف لكافة التغييرات والعمليات المنفذة في النظام.

### المرحلة 2: الكتالوج والمخزون المزدوج (Phase 2 — Products & Inventory) ✅
- **كتالوج المنتجات ووحدات القياس (UOMs)**:
  - شجرة تصنيفات المنتجات الهرمية مع إنشاء المسار التلقائي (`complete_name`).
  - فئات وحدات القياس (الوزن، الحجم، العدد، الطول) مع نسب التحويل القياسية.
  - أنواع الأصناف (مخزني، استهلاكي، خدمي) وطرق التتبع (أرقام تشغيلات Lot، سيريال Serial).
- **محرك المخزون بالقيد المزدوج (Double-Entry Stock Engine)**:
  - شجرة المواقع الهرمية (مواقع داخلية، مواقع الموردين، مواقع العملاء، ومواقع فروقات الجرد والتلف).
  - حركات المخزون المقيدة (Stock Moves Ledger): البضائع تنتقل بين المواقع دون استحداث أو فناء.
  - أذون الاستلام (`WH/IN/`)، أوامر الصرف والتسليم (`WH/OUT/`)، والتحويلات الداخلية (`WH/INT/`).
- **الجرد الفعلي وتسوية الفروقات (Physical Inventory Adjustments)**:
  - جلسات جرد دورية تحسب الأرصدة الدفترية آليًا وترصد الفروقات الفعلية مع توليد قيود التسوية.

### المرحلة 3: محرك إدارة المبيعات (Phase 3 — Sales Engine) ✅
- **دورة حياة أوامر البيع الكاملة**:
  - `draft` (مسودة عرض سعر) $\rightarrow$ `sent` (مرسل للعميل) $\rightarrow$ `sale` (أمر بيع معتمد) $\rightarrow$ `done` $\rightarrow$ `cancelled`.
- **التسعير والخصومات والضريبة المصرية 14%**: حسابات مالية دقيقة لكل سطر مع الخصومات المئوية وضريبة القيمة المضافة.
- **الربط التلقائي بالمخازن (Sales $\rightarrow$ Delivery Trigger)**:
  - تأكيد أمر البيع يُنشئ تلقائيًا إذن صرف وتسليم بضاعة (`WH/OUT/xxxxx`) مع حجز المخزون وتوليد `stock_moves` لجميع المنتجات القابلة للتخزين.

### المرحلة 4: محرك المشتريات والموردين (Phase 4 — Purchases Engine) ✅
- **دورة أوامر الشراء وطلبات الأسعار (RFQs & POs)**:
  - `draft` (طلب عرض أسعار) $\rightarrow$ `sent` (مرسل للمورد) $\rightarrow$ `purchase` (أمر شراء معتمد) $\rightarrow$ `done` $\rightarrow$ `cancelled`.
- **الربط التلقائي بالاستلام المخزني (Purchases $\rightarrow$ Receipt Trigger)**:
  - تأكيد أمر الشراء يُنشئ تلقائيًا إذن استلام بضائع واردة (`WH/IN/xxxxx`) لنقل البضاعة من موقع المورد إلى رصيد المخزن الداخلي.

### المرحلة 5: الحسابات العامة، الفواتير والمدفوعات (Phase 5 — General Ledger & Accounting) ✅
- **دليل الحسابات المصري الموحد (Egyptian Standard COA)**:
  - شجرة حسابات متكاملة: الأصول (نقدية، بنوك، عملاء، مخزون)، الخصوم (موردون، ضريبة مبيعات، ضريبة مشتريات)، حقوق الملكية، الإيرادات، والمصروفات (COGS، عمومية وإدارية).
  - دفاتر اليومية المخصصة: المبيعات (`INV`)، المشتريات (`BILL`)، الخزينة (`CSH`)، البنك (`BNK`)، والعمليات المتنوعة (`MISC`).
- **محرك القيود المزدوجة المتوازنة (`account_moves` & `account_move_lines`)**:
  - **حتمية التوازن الصارمة**: يفرض المحرك عدم ترحيل أي قيد إلا إذا كان `SUM(debit_cents) == SUM(credit_cents)`.
  - إنشاء فواتير المبيعات وفواتير الموردين مع توزيع قيود الذمم والضرائب آلياً.
  - عكس القيود المحاسبية والإشعارات الدائنة (`reverse_move`).
- **سندات القبض والصرف والتسوية النقدية (`account_payments`)**:
  - تسجيل مقبوضات العملاء ومدفوعات الموردين مع الترحيل التلقائي لدفاتر النقدية والبنوك وتسوية الفواتير (`paid`).
- **ميزان المراجعة الحي (Real-Time Trial Balance)**:
  - كشف شامل لحركات وأرصدة جميع الحسابات مع مطابقة فورية لإجمالي المدين وإجمالي الدائن.

---

## ⚡ التحديات الهندسية والحلول (Challenges & Solutions)

### 1. انضباط القيد المزدوج للمخزون والمالية (Double-Entry Balance Invariant)
* **التحدي**: منع أي انحراف مالي أو مخزني، والتأكد من توازن كل عملية بنسبة 100% دون استثناء.
* **الحل**: حظر التعديل المباشر للأرصدة؛ كل حركة مالية تتكون من سطور `debit_cents` و `credit_cents` متطابقة، وكل حركة مخزنية تتكون من حركة من موقع مصدر إلى وجهة مع تدقيق العمليات داخل معاملات SQLite الذرية (ACID Transactions).

### 2. الدقة المالية وتفادي أخطاء الفاصلة العائمة (Precision & Rounding Issues)
* **التحدي**: معالجة آلاف العمليات والضرائب والخصومات دون فقدان أجزاء القروش أو الوقوع في أخطاء التقريب للفاصلة العائمة (IEEE-754 Floats).
* **الحل**: الاعتماد الكامل على الأعداد الصحيحة بتمثيل الملي (Milli-units: $1.000 = 1000$) للكميات والنسب، والقروش (Minor Units / Cents) للقيم النقدية.

---

## 🚀 دليل التثبيت والتشغيل (Getting Started)

### المتطلبات المسبقة (Prerequisites)
* **Node.js**: الإصدار 18 أو أحدث (`v18+` / `v20+`).
* **Rust & Cargo**: أحدث إصدار مستقر (`v1.85+`).
* **C++ Build Tools / MinGW Toolchain** لنظام Windows.

### خطوات التثبيت والتشغيل المحلي

1. **استنساخ المستودع (Clone Repository)**:
   ```bash
   git clone https://github.com/Omar-b381/MIZAN-ERP.git
   cd MIZAN-ERP
   ```

2. **تثبيت حزم الواجهة الأمامية (Install Frontend Dependencies)**:
   ```bash
   npm install
   ```

3. **تشغيل الاختبارات التلقائية (Run Automated Tests)**:
   - اختبارات الواجهة الأمامية (Vitest - 23 اختبار):
     ```bash
     npm test
     ```
   - اختبارات المحرك الخلفي (Rust Integration Tests - 24 اختبار):
     ```bash
     cargo test --lib
     ```

4. **تشغيل التطبيق في بيئة التطوير (Run Development App)**:
   ```bash
   npm run tauri dev
   ```

5. **بناء حزمة الإنتاج (Build Production Executable)**:
   ```bash
   npm run tauri build
   ```

---

## 🗺️ القيود وخارطة الطريق المستقبلية (Limitations & Roadmap)

| المرحلة | الوحدة / الميزة | الحالة | الوصف |
| :--- | :--- | :---: | :--- |
| **Phase 0** | النواة وقاعدة البيانات | ✅ مكتمل | إعداد Tauri v2 + SQLite WAL + Migrations |
| **Phase 1** | الشركات، RBAC، وجهات الاتصال | ✅ مكتمل | إدارة الشركات، الصلاحيات، والشركاء وسجل النشاط |
| **Phase 2** | كتالوج المنتجات والمخزون المزدوج | ✅ مكتمل | الأصناف، وحدات القياس، الأذون، والجرد الفعلي |
| **Phase 3** | إدارة المبيعات (Sales Engine) | ✅ مكتمل | عروض الأسعار، أوامر البيع، الضريبة 14%، وأذون الصرف |
| **Phase 4** | المشتريات (Purchases & POs) | ✅ مكتمل | طلبات الشراء، أوامر التوريد، والربط مع الاستلام المخزني |
| **Phase 5** | الحسابات والفوترة والمدفوعات | ✅ مكتمل | دليل الحسابات، القيود المزدوجة، الفواتير، وميزان المراجعة |
| **Phase 6** | الموارد البشرية (HR & Attendance) | ✅ مكتمل | دليل الموظفين، عقود العمل، الإجازات، وسجلات الحضور |
| **Phase 7** | لوحة المؤشرات التنفيذية وحزم التثبيت | 🔄 قادم | لوحة التحكم الذكية ومثبت Windows `.msi / .exe` المستقل |

---

## 👥 الجمهور المستهدف (Intended Use)

صُمم **ميزان ERP** ليخدم:
1. **الشركات والمؤسسات التجارية**: التي تبحث عن نظام محاسبي، مبيعات، مشتريات، ومخزني متكامل وبسيط دون تكاليف خوادم باهظة.
2. **شركات التوزيع والتوريدات**: التي تتطلب تتبعًا دقيقًا للمخازن المتعددة، أذون الاستلام والصرف، وتسوية الفواتير.
3. **المحاسبين والمديرين الماليين**: الراغبين في أداة دقيقة تعمل محليًا دون انقطاع، تضمن توازن القيود اليومية وميزان المراجعة مع الحفاظ على سرية البيانات.

---

## 📄 الترخيص والمصادر المرجعية (Credits & License)

- **الترخيص (License)**: المشروع مرخص تحت رخصة [MIT License](LICENSE).
- **المصادر المرجعية (Architectural Inspiration)**: تم استلهام تصميم النطاق المعياري من ممارسات أنظمة الـ ERP المفتوحة المصدر الرائدة (مثل AureusERP و Odoo) مع إعادة البناء الهندسي الكامل كـ Native Rust/Tauri Desktop Application.

---
<div align="center">
  <sub>صُنع بكل إتقان واحترافية • ميزان ERP © 2026</sub>
</div>
