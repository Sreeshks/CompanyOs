"""
Initial seed configuration for Company OS.
Populates standard reference tables without hardcoding business rules into core logic.
"""

PERMISSIONS = [
    # Users
    {"code": "users.view", "module": "users", "description": "View users and profiles"},
    {"code": "users.create", "module": "users", "description": "Create new users"},
    {"code": "users.edit", "module": "users", "description": "Edit user details"},
    {"code": "users.manage", "module": "users", "description": "Manage user roles, status, and credentials"},
    # Clients
    {"code": "clients.view", "module": "clients", "description": "View client directory"},
    {"code": "clients.create", "module": "clients", "description": "Create new client records"},
    {"code": "clients.edit", "module": "clients", "description": "Update client records"},
    {"code": "clients.archive", "module": "clients", "description": "Archive/soft-delete clients"},
    # Pipeline
    {"code": "pipeline.view", "module": "pipeline", "description": "View client sales pipeline"},
    {"code": "pipeline.manage", "module": "pipeline", "description": "Transition pipeline stages"},
    # Documents
    {"code": "documents.view", "module": "documents", "description": "View financial documents"},
    {"code": "documents.create", "module": "documents", "description": "Create financial documents"},
    {"code": "documents.generate", "module": "documents", "description": "Generate official document numbers"},
    # Workspace
    {"code": "workspace.view", "module": "workspace", "description": "View client workspaces and folders"},
    {"code": "workspace.create", "module": "workspace", "description": "Create client workspaces and folders"},
    {"code": "workspace.edit", "module": "workspace", "description": "Edit and move folders"},
    {"code": "workspace.delete", "module": "workspace", "description": "Delete folders and workspaces"},
    # Content
    {"code": "content.view", "module": "content", "description": "View creative content items"},
    {"code": "content.create", "module": "content", "description": "Upload/register content items"},
    {"code": "content.edit", "module": "content", "description": "Edit content metadata"},
    {"code": "content.move", "module": "content", "description": "Move content across stages and folders"},
    # Tasks
    {"code": "tasks.view", "module": "tasks", "description": "View tasks"},
    {"code": "tasks.create", "module": "tasks", "description": "Create new tasks"},
    {"code": "tasks.assign", "module": "tasks", "description": "Assign tasks to staff"},
    {"code": "tasks.reassign", "module": "tasks", "description": "Reassign tasks to other staff"},
    {"code": "tasks.complete", "module": "tasks", "description": "Mark tasks completed"},
    # Approvals
    {"code": "approval.view", "module": "approval", "description": "View approvals and reviews"},
    {"code": "approval.manage", "module": "approval", "description": "Generate approval links and process decisions"},
    # Reporting & Dashboard
    {"code": "reports.view", "module": "reports", "description": "View detailed productivity and client reports"},
    {"code": "dashboard.view", "module": "dashboard", "description": "View executive and team dashboard"},
    # System & Audit
    {"code": "settings.manage", "module": "settings", "description": "Manage system configurations and masters"},
    {"code": "audit.view", "module": "audit", "description": "View audit logs"}
]

DEPARTMENTS = [
    {"name": "GBP Management", "code": "GBP"},
    {"name": "Social Media Management", "code": "SMM"},
    {"name": "Website Development & SEO", "code": "WEB_SEO"},
    {"name": "Event Photography & Videography", "code": "PHOTO_VIDEO"},
    {"name": "Sales & New Business", "code": "SALES"},
    {"name": "Management", "code": "MGMT"},
    {"name": "Coordination", "code": "COORD"},
    {"name": "Multiple/All-Rounder", "code": "ALL_ROUND"}
]

DESIGNATIONS = [
    {"name": "Managing Director", "code": "MD"},
    {"name": "Operations Manager", "code": "OM"},
    {"name": "Senior Photographer", "code": "SR_PHOTO"},
    {"name": "Photo Editor", "code": "PHOTO_ED"},
    {"name": "Graphic Designer", "code": "GRAPHIC_DES"},
    {"name": "SEO Specialist", "code": "SEO_SPEC"},
    {"name": "Account Executive", "code": "ACC_EXEC"}
]

BILLING_COMPANIES = [
    {
        "name": "Adox Global Ventures LLC",
        "short_code": "ADX",
        "vat_applicable": True,
        "tax_number": "OM-VAT-1002345",
        "address": "Al Khuwair, Muscat, Sultanate of Oman",
        "email": "billing@adoxglobal.com",
        "phone": "+968 2400 1122"
    },
    {
        "name": "Pixel Business Solutions LLC",
        "short_code": "PXL",
        "vat_applicable": False,
        "tax_number": None,
        "address": "Ruwi, Muscat, Sultanate of Oman",
        "email": "accounts@pixeloman.com",
        "phone": "+968 2470 3344"
    }
]

TASK_TYPES = [
    {"name": "Photo Taking", "code": "PHOTO_TAKE", "description": "On-site raw photo shoot"},
    {"name": "Selection", "code": "SELECTION", "description": "Filtering and shortlisting raw items"},
    {"name": "Editing", "code": "EDITING", "description": "Color correction, retouching, and composition"},
    {"name": "Re-editing", "code": "RE_EDITING", "description": "Fixing client-requested modifications"},
    {"name": "Posting", "code": "POSTING", "description": "Publishing approved assets to client channels"},
    {"name": "Poster Creation", "code": "POSTER_CREATE", "description": "Graphic design and promotional posters"},
    {"name": "SEO", "code": "SEO", "description": "On-page and technical SEO optimizations"},
    {"name": "Social Media", "code": "SOCIAL_MEDIA", "description": "Social media channel management"},
    {"name": "Monthly Report", "code": "MONTHLY_REP", "description": "Compilation of monthly performance report"},
    {"name": "Sales Follow-up", "code": "SALES_FOLLOWUP", "description": "Client outreach and quotation follow-up"},
    {"name": "Review Reply", "code": "REVIEW_REPLY", "description": "Google and social review responses"}
]

CONTENT_TYPES = [
    {"name": "Photo", "code": "PHOTO", "description": "Standard photograph item"},
    {"name": "Poster", "code": "POSTER", "description": "Promotional designed poster"},
    {"name": "Video", "code": "VIDEO", "description": "Short form video/reel"},
    {"name": "Document Deliverable", "code": "DOC_DELIVERABLE", "description": "SEO or monthly report document"}
]

DOCUMENT_TYPES = [
    {"name": "Quotation", "code": "QUO", "description": "Commercial pricing proposal"},
    {"name": "Agreement", "code": "AGR", "description": "Binding client service contract"},
    {"name": "Invoice", "code": "INV", "description": "Tax / standard billing invoice"},
    {"name": "Receipt Voucher", "code": "RCV", "description": "Proof of payment received"},
    {"name": "Payment Voucher", "code": "PMV", "description": "Disbursement / payment voucher"}
]

CLIENT_STATUSES = [
    {"name": "Lead", "code": "LEAD", "color": "#9CA3AF", "order_index": 1, "is_terminal": False},
    {"name": "Quotation Draft", "code": "QUO_DRAFT", "color": "#F59E0B", "order_index": 2, "is_terminal": False},
    {"name": "Quotation Sent", "code": "QUO_SENT", "color": "#3B82F6", "order_index": 3, "is_terminal": False},
    {"name": "Won", "code": "WON", "color": "#10B981", "order_index": 4, "is_terminal": False},
    {"name": "Lost", "code": "LOST", "color": "#EF4444", "order_index": 5, "is_terminal": True},
    {"name": "Agreement Pending", "code": "AGR_PENDING", "color": "#8B5CF6", "order_index": 6, "is_terminal": False},
    {"name": "Invoice Pending", "code": "INV_PENDING", "color": "#6366F1", "order_index": 7, "is_terminal": False},
    {"name": "Project Ongoing", "code": "PROJECT_ONGOING", "color": "#059669", "order_index": 8, "is_terminal": False},
    {"name": "Renewal Due", "code": "RENEWAL_DUE", "color": "#D97706", "order_index": 9, "is_terminal": False},
    {"name": "Renewed", "code": "RENEWED", "color": "#10B981", "order_index": 10, "is_terminal": False},
    {"name": "Completed", "code": "COMPLETED", "color": "#6B7280", "order_index": 11, "is_terminal": True}
]

PIPELINE_TRANSITIONS = [
    {"from": "LEAD", "to": "QUO_DRAFT", "action": "Generate Quotation"},
    {"from": "QUO_DRAFT", "to": "QUO_SENT", "action": "Send Quotation"},
    {"from": "QUO_SENT", "to": "WON", "action": "Mark Won"},
    {"from": "QUO_SENT", "to": "LOST", "action": "Mark Lost"},
    {"from": "WON", "to": "AGR_PENDING", "action": "Generate Agreement"},
    {"from": "AGR_PENDING", "to": "INV_PENDING", "action": "Generate Invoice"},
    {"from": "INV_PENDING", "to": "PROJECT_ONGOING", "action": "Start Project"},
    {"from": "PROJECT_ONGOING", "to": "RENEWAL_DUE", "action": "Mark Renewal Due"},
    {"from": "RENEWAL_DUE", "to": "RENEWED", "action": "Renew"},
    {"from": "RENEWAL_DUE", "to": "COMPLETED", "action": "Complete"},
    {"from": "PROJECT_ONGOING", "to": "COMPLETED", "action": "Complete"},
    {"from": "RENEWED", "to": "PROJECT_ONGOING", "action": "Start Project"}
]
