# FPL Fantasy Planner Enhancement Design

## Overview

This design enhances the FantasyPlanner component to provide a comprehensive FPL (Fantasy Premier League) experience including live data, transfer planning, price tracking, ownership changes, chip strategies, and future transfer analytics. The enhancement transforms the current basic team viewer into a full-featured FPL management tool.

## Technology Stack & Dependencies

### Current Stack
- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: Tailwind CSS, Framer Motion for animations
- **State Management**: React hooks (useState, useEffect, useMemo, useCallback)
- **Icons**: React Icons (FaShare, FaExpand, etc.), Lucide React
- **API Integration**: FPL Service Layer

### Additional Dependencies Required
- **Chart Visualization**: Chart.js or Recharts for price/ownership charts
- **Date Handling**: date-fns for gameweek calculations
- **Data Tables**: TanStack Table for advanced filtering/sorting
- **Virtual Scrolling**: react-window for large player lists

## Enhanced Component Architecture

### Core Components

#### 1. Enhanced FantasyPlanner (Main Container)
```mermaid
graph TD
    FP[FantasyPlanner] --> TDH[TeamDataHeader]
    FP --> MPV[MainPitchView]
    FP --> ES[EnhancedSidebar]
    FP --> MIM[ManagerIdModal]
    
    TDH --> TS[TeamStats]
    TDH --> VI[VerificationInfo]
    
    MPV --> PV[PitchView]
    MPV --> LV[ListView]
    MPV --> FP_Sub[FilterPanel]
    MPV --> TP[TransferPanel]
    
    ES --> LS[LiveStats]
    ES --> PC[PriceChanges]
    ES --> OC[OwnershipChanges]
    ES --> TT[TransferTrends]
    ES --> CS[ChipStrategies]
    
    PV --> PP[PitchPlayer]
    PV --> FB[FormationBuilder]
    
    LV --> PT[PlayerTable]
    LV --> AS[AdvancedSearch]
```

#### 2. Enhanced Sidebar Components

```mermaid
classDiagram
    class PriceChangesWidget {
        +risers: Player[]
        +fallers: Player[]
        +refreshInterval: number
        +renderPriceChange()
        +calculatePriceImpact()
    }
    
    class OwnershipChangesWidget {
        +topRisers: Player[]
        +topFallers: Player[]
        +timeframe: string
        +renderOwnershipChange()
        +getOwnershipTrend()
    }
    
    class TransferTrendsWidget {
        +currentTransfers: Transfer[]
        +futureTransfers: Transfer[]
        +topPlayersIn: Player[]
        +topPlayersOut: Player[]
        +renderTransferTrend()
    }
    
    class ChipStrategiesWidget {
        +wildcardData: ChipUsage[]
        +freehitData: ChipUsage[]
        +benchboostData: ChipUsage[]
        +tripleCaptainData: ChipUsage[]
        +renderChipStrategy()
        +getOptimalChipWeek()
    }
```

#### 3. Enhanced Pitch View

```mermaid
graph TD
    PV[PitchView] --> FL[FieldLayout]
    FL --> GA[GoalArea]
    FL --> PA[PenaltyArea]
    FL --> CC[CenterCircle]
    FL --> FB[FieldBoundaries]
    
    PV --> FP[FormationPositioning]
    FP --> FWD[Forwards]
    FP --> MID[Midfielders]
    FP --> DEF[Defenders]
    FP --> GK[Goalkeeper]
    
    PV --> EP[EnhancedPlayer]
    EP --> PK[PlayerKit]
    EP --> CB[CaptainBadge]
    EP --> PP[PlayerPoints]
    EP --> HT[HoverTooltip]
```

### Data Models & Interfaces

#### Enhanced Player Data
```typescript
interface EnhancedPlayerData extends PlayerData {
  // Price tracking
  price_change_event: number;
  price_change_start: number;
  price_change_event_fall: number;
  
  // Ownership tracking
  ownership_change_1h: number;
  ownership_change_24h: number;
  ownership_trend: 'rising' | 'falling' | 'stable';
  
  // Transfer data
  transfers_in_1h: number;
  transfers_out_1h: number;
  net_transfers: number;
  
  // Performance metrics
  form_rank: number;
  value_rank: number;
  ownership_rank: number;
  
  // Injury/availability
  availability_status: 'available' | 'doubtful' | 'injured' | 'suspended';
  injury_news: string;
  return_date?: string;
}
```

#### Transfer Planning
```typescript
interface TransferPlan {
  playersOut: EnhancedPlayerData[];
  playersIn: EnhancedPlayerData[];
  cost: number;
  freeTransfers: number;
  weekPlanned: number;
  totalCost: number;
  expectedGain: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ChipStrategy {
  chipType: 'wildcard' | 'freehit' | 'benchboost' | 'triplecaptain';
  optimalWeeks: number[];
  usage_stats: {
    week: number;
    usage_count: number;
    success_rate: number;
  }[];
}
```

#### Filter & Search State
```typescript
interface EnhancedFilterState extends FilterState {
  // Price filters
  priceChangeMin: number;
  priceChangeMax: number;
  
  // Ownership filters
  ownershipMin: number;
  ownershipMax: number;
  ownershipTrend: string[];
  
  // Transfer filters
  transfersInMin: number;
  transfersOutMin: number;
  
  // Performance filters
  formMin: number;
  valueMin: number;
  
  // Fixture difficulty
  nextFixtureDifficulty: number[];
  fixtureCount: number;
  
  // Advanced search
  searchMode: 'basic' | 'advanced';
  multiplePositions: boolean;
  includeInjured: boolean;
}
```

## Enhanced UI Layout Design

### Main Layout Structure
```mermaid
graph LR
    ML[Main Layout] --> H[Header]
    ML --> MC[Main Content]
    ML --> S[Sidebar]
    
    H --> TS[Team Stats]
    H --> VC[View Controls]
    H --> AC[Action Controls]
    
    MC --> PV[Pitch View]
    MC --> LV[List View]
    MC --> FP[Filter Panel]
    MC --> TP[Transfer Panel]
    
    S --> LS[Live Stats]
    S --> PC[Price Changes]
    S --> OC[Ownership Changes]
    S --> TT[Transfer Trends]
    S --> CS[Chip Strategies]
```

### Responsive Pitch Layout
The pitch view displays a vertical half-field layout optimized for mobile:

```mermaid
graph TD
    subgraph "Opponent Goal (Top)"
        OG[Goal Line]
        OGA[Goal Area]
        OPA[Penalty Area]
    end
    
    subgraph "Formation Layout"
        FWD[Forwards - Top Row]
        MID[Midfielders - Middle Rows]
        DEF[Defenders - Lower Row]
        GK[Goalkeeper - Bottom]
    end
    
    subgraph "Our Goal (Bottom)"
        CC[Center Circle]
        CL[Center Line]
    end
    
    OG --> OGA
    OGA --> OPA
    OPA --> FWD
    FWD --> MID
    MID --> DEF
    DEF --> GK
    GK --> CC
    CC --> CL
```

### Enhanced Player Cards
```mermaid
classDiagram
    class EnhancedPlayerCard {
        +playerId: number
        +position: string
        +isCaptain: boolean
        +isViceCaptain: boolean
        +teamColors: TeamColor
        +livePoints: number
        +priceChange: number
        +ownershipChange: number
        +injuryStatus: string
        +renderPlayerKit()
        +renderCaptainBadge()
        +renderPriceIndicator()
        +renderOwnershipIndicator()
        +renderInjuryBadge()
        +renderTooltip()
    }
```

## Sidebar Widget Implementations

### 1. Price Changes Widget
- **Real-time price risers/fallers**
- **Price change indicators with arrows**
- **Impact calculation on user's team**
- **Future price prediction**

### 2. Ownership Changes Widget
- **Hourly ownership changes**
- **Trending players (rising/falling)**
- **Ownership percentage display**
- **Historical ownership graphs**

### 3. Transfer Trends Widget
- **Current week top transfers**
- **Future week transfer plans**
- **Most transferred in/out players**
- **Transfer volume indicators**

### 4. Chip Strategy Widget
- **Optimal chip usage weeks**
- **Historical chip usage statistics**
- **Success rate analysis**
- **Personalized chip recommendations**

## API Integration Architecture

### Enhanced FPL Service Methods

```mermaid
sequenceDiagram
    participant FP as FantasyPlanner
    participant API as FPL API Service
    participant FPLAPI as Official FPL API
    participant Cache as Cache Layer
    
    FP->>API: fetchEnhancedBootstrapData()
    API->>Cache: checkCache('bootstrap_enhanced')
    Cache-->>API: cached/null
    API->>FPLAPI: /bootstrap-static/
    API->>FPLAPI: /fixtures/
    API->>FPLAPI: /events/
    FPLAPI-->>API: combined data
    API->>Cache: store('bootstrap_enhanced', data)
    API-->>FP: enhanced player data
    
    FP->>API: fetchPriceChanges()
    API->>Cache: checkCache('price_changes')
    Cache-->>API: cached/null
    API->>FPLAPI: /elements/
    FPLAPI-->>API: player data with prices
    API->>API: calculatePriceChanges()
    API-->>FP: price change data
    
    FP->>API: fetchTransferTrends()
    API->>Cache: checkCache('transfer_trends')
    Cache-->>API: cached/null
    API->>FPLAPI: /transfers/
    FPLAPI-->>API: transfer data
    API-->>FP: transfer trends
```

### Required API Endpoints

#### Existing Endpoints to Enhance
- `/api/fpl/bootstrap-static` - Enhanced with price/ownership tracking
- `/api/fpl/load-team` - Enhanced with advanced team analytics
- `/api/fpl/fixtures` - Enhanced with difficulty ratings

#### New Endpoints Required
- `/api/fpl/price-changes` - Real-time price change tracking
- `/api/fpl/ownership-trends` - Ownership change analytics
- `/api/fpl/transfer-analytics` - Transfer trend analysis
- `/api/fpl/chip-strategies` - Chip usage optimization
- `/api/fpl/future-transfers` - Planned transfer analytics

## Enhanced Filter & Search System

### Advanced Player Filtering
```mermaid
graph TD
    FS[Filter System] --> BF[Basic Filters]
    FS --> AF[Advanced Filters]
    FS --> SF[Smart Filters]
    
    BF --> PF[Position Filter]
    BF --> TF[Team Filter]
    BF --> PrF[Price Range Filter]
    
    AF --> PCF[Price Change Filter]
    AF --> OCF[Ownership Change Filter]
    AF --> FF[Form Filter]
    AF --> AvF[Availability Filter]
    AF --> FDF[Fixture Difficulty Filter]
    
    SF --> VF[Value Finder]
    SF --> DF[Differential Finder]
    SF --> RF[Rotation Finder]
    SF --> IF[Injury Replacements]
```

### Search Functionality
- **Multi-criteria search (name, team, position)**
- **Fuzzy search with suggestions**
- **Search history and saved filters**
- **Quick filter presets (differentials, value picks, etc.)**

## Transfer Planning Features

### Transfer Planner Interface
```mermaid
stateDiagram-v2
    [*] --> ViewingTeam
    ViewingTeam --> SelectingOut: Click player to transfer out
    SelectingOut --> BrowsingReplacements: Choose replacement category
    BrowsingReplacements --> FilteringPlayers: Apply filters
    FilteringPlayers --> ComparingOptions: Compare potential transfers
    ComparingOptions --> PlanningTransfer: Select replacement
    PlanningTransfer --> ViewingImpact: Preview transfer impact
    ViewingImpact --> ConfirmingTransfer: Confirm transfer
    ViewingImpact --> BrowsingReplacements: Change mind
    ConfirmingTransfer --> ViewingTeam: Transfer planned
    ConfirmingTransfer --> [*]: Transfer executed
```

### Transfer Analysis Features
- **Cost calculation (free transfers vs. hits)**
- **Expected points gain/loss analysis**
- **Fixture difficulty comparison**
- **Risk assessment (injury prone, rotation risk)**
- **Alternative suggestions**

## Mobile-First Responsive Design

### Breakpoint Strategy
```mermaid
graph LR
    Mobile[Mobile: 320-768px] --> Tablet[Tablet: 768-1024px]
    Tablet --> Desktop[Desktop: 1024px+]
    
    Mobile --> SV[Single Column View]
    Mobile --> CP[Collapsible Panels]
    Mobile --> TS[Touch-Optimized]
    
    Tablet --> TV[Two Column View]
    Tablet --> EP[Expanded Panels]
    
    Desktop --> FV[Full Layout View]
    Desktop --> MSB[Multi-Sidebar]
```

### Mobile Optimizations
- **Collapsible sidebar widgets**
- **Swipe gestures for navigation**
- **Touch-optimized player selection**
- **Reduced data density for small screens**
- **Optimized pitch layout for vertical screens**

## Performance Optimization

### Caching Strategy
```mermaid
graph TD
    CS[Caching Strategy] --> MC[Memory Cache]
    CS --> BC[Browser Cache]
    CS --> IC[IndexedDB Cache]
    
    MC --> BSD[Bootstrap Static Data - 10min]
    MC --> PCD[Price Change Data - 1min]
    MC --> TLD[Team Load Data - 5min]
    
    BC --> SA[Static Assets]
    BC --> API[API Responses]
    
    IC --> HP[Historical Price Data]
    IC --> HO[Historical Ownership Data]
    IC --> TP[Transfer Plans]
```

### Virtual Scrolling Implementation
- **Large player lists (500+ players)**
- **Smooth scrolling performance**
- **Dynamic loading based on viewport**
- **Optimized re-rendering**

## Data Synchronization

### Real-time Updates
```mermaid
sequenceDiagram
    participant UI as User Interface
    participant WS as WebSocket/Polling
    participant API as API Server
    participant FPL as FPL Official API
    
    UI->>WS: Subscribe to live updates
    loop Every 30 seconds
        WS->>API: Request latest data
        API->>FPL: Fetch live scores/prices
        FPL-->>API: Updated data
        API->>API: Process changes
        API-->>WS: Push updates
        WS-->>UI: Update UI components
    end
```

### Update Frequencies
- **Live scores**: 30 seconds during matches
- **Price changes**: 1 minute
- **Ownership changes**: 5 minutes
- **Transfer trends**: 15 minutes
- **Team data**: Manual refresh or 5 minutes

## Testing Strategy

### Component Testing
- **Player card rendering with various states**
- **Filter functionality with complex criteria**
- **Transfer planning workflow**
- **Responsive layout behavior**

### Integration Testing
- **API service integration**
- **Cache invalidation scenarios**
- **Real-time update handling**
- **Error state management**

### Performance Testing
- **Large dataset rendering (1000+ players)**
- **Memory usage optimization**
- **API response time monitoring**
- **Mobile device performance**