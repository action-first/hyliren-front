# Design Tokens

## FO — Warm, Trust, Premium (Airbnb 톤)

```css
--fo-bg: #FFFFFF;
--fo-bg-secondary: #F7F7F7;
--fo-text: #222222;
--fo-text-secondary: #717171;
--fo-text-dim: #B0B0B0;
--fo-accent: #FF385C;
--fo-accent-soft: rgba(255, 56, 92, 0.08);
--fo-border: #DDDDDD;
--fo-border-light: #EBEBEB;
--fo-radius-sm: 8px;
--fo-radius-md: 12px;
--fo-radius-lg: 16px;
--fo-font: 'Pretendard Variable', sans-serif;
```

## PO / BO — Neutral, Functional (Shopify 톤)

```css
--admin-bg: #F6F6F7;
--admin-surface: #FFFFFF;
--admin-text: #1A1A1A;
--admin-text-secondary: #616161;
--admin-text-dim: #8C8C8C;
--admin-accent: #008060;
--admin-accent-soft: rgba(0, 128, 96, 0.08);
--admin-border: #E1E1E1;
--admin-radius-sm: 4px;
--admin-radius-md: 8px;
--admin-font: 'Inter', sans-serif;
```

## Semantic

```css
--color-success: #008060;
--color-warning: #FFC453;
--color-danger: #D72C0D;
--color-info: #0099FF;
```

## Typography

| Token | FO | PO/BO |
|-------|-----|-------|
| h1 | 1.625rem (26px) | 1.5rem (24px) |
| h2 | 1.375rem (22px) | 1.25rem (20px) |
| h3 | 1.125rem (18px) | 1rem (16px) |
| body | 1rem (16px) | 0.875rem (14px) |
| small | 0.875rem (14px) | 0.8125rem (13px) |
| micro | 0.75rem (12px) | 0.75rem (12px) |

## Spacing

4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48

## MVP 컴포넌트

**공통 (packages/ui)**:
Button, Input, Textarea, Select, Upload, Card, Badge, Tabs, Modal, Empty, Skeleton

**FO 패턴**:
ConcernCard, ProposalCard, CompareView, ArticleCard, ReportCTA, ServiceCard

**PO/BO 패턴**:
DataTable, KPIPanel, StatusBadge, CreditStatus
