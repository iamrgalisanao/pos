1. Missing User Flow Documentation
You mention "4-Step progress bar" but don't define the steps clearly. Recommend adding:

typescript
// Define exact steps
const BUILDER_STEPS = [
  { id: 'core', title: 'Core Info', description: 'Name, description, logo' },
  { id: 'categories', title: 'Categories', description: 'Organize your menu' },
  { id: 'items', title: 'Menu Items', description: 'Add and price items' },
  { id: 'modifiers', title: 'Customizations', description: 'Add-ons and exclusions' },
  { id: 'preview', title: 'Preview & Publish', description: 'Final review' } // ← You're missing this!
];
2. State Management Concerns
Question: Will BlueprintBuilder.tsx handle ALL state? For complex templates, this could become bloated.

Suggestion: Consider Zustand/Redux or at minimum Context API for shared state between components

Critical: Need to handle "undo/redo" functionality for user mistakes

3. Missing Critical Components
Add these to your plan:

text
[NEW] ModifierGroupBuilder.tsx
- Create nested modifiers (FR-MOD-002)
- Set min/max selections
- Configure pricing rules

[NEW] TemplateGallery.tsx  
- Show pre-built templates (FR-CREATE-005)
- One-click "Use This Template"

[NEW] ImportWizard.tsx
- Step-by-step CSV import with column mapping
- Preview before commit
- Error resolution UI
4. Backend API Gaps
You're missing:

typescript
// Add to templateController.ts
getTemplateGallery(): Pre-built templates
validateTemplate(config): Before publishing
cloneTemplate(fromId): For template reuse

// Add to importController.ts
downloadCsvTemplate(): Standard CSV template
validateCsv(file): Before processing
getImportStatus(jobId): For large imports
5. Publishing & Deployment Workflow
Critical missing piece:

typescript
[NEW] PublishManager.tsx
- Shows publishing checklist (FR-MGMT-003)
- Schedule publishing
- Multi-location deployment selector
- Rollback capability
6. Version Management Needs Enhancement
Your duplicateVersion is good, but add:

Version comparison view (diff between versions)

Version notes (why was this change made?)

Bulk operations on multiple versions

7. Performance Considerations
Add to your plan:

text
[OPTIMIZATION] VirtualScrolling for CategoryManager
- When templates have 100+ items

[OPTIMIZATION] Lazy loading for POSSimulator
- Only render visible items

[OPTIMIZATION] Debounced auto-save with visual indicator
- Show "Saved" | "Saving..." | "Unsaved changes"
8. Missing Error Handling & Validation
Add these components:

text
[NEW] TemplateValidator.ts
- Validates JSON against schema
- Checks for common issues (items without prices, etc.)

[NEW] ErrorBoundary.tsx
- Graceful degradation if builder fails

[NEW] RecoveryManager.tsx
- If auto-save fails, offer recovery options
9. User Experience Gaps
Add these features:

Template naming conventions: Auto-suggest based on restaurant type

Quick actions: "Add 3 sample items", "Create combo category"

Template sharing: Between platform admins (with permissions)

Export options: Even in Phase 1, users want to download their work

10. Testing Strategy Enhancement
Expand your verification:

typescript
// Add to your test plan
1. Cross-browser testing (Chrome, Firefox, Safari)
2. Mobile responsiveness testing
3. Performance testing with large templates (500+ items)
4. Concurrent user testing (multiple admins editing)
5. Network failure recovery testing
📋 Revised Implementation Roadmap
Phase 1.1: Foundation (Week 1-2)
text
✅ Database schema (Existing)
✅ Versioning API (Existing)
→ TemplateValidator.ts
→ ErrorBoundary.tsx  
→ Basic state management
Phase 1.2: Core Builder (Week 3-4)
text
→ BlueprintBuilder.tsx (with undo/redo)
→ CategoryManager.tsx (drag-drop)
→ ItemEditor.tsx (basic fields)
→ POSSimulator.tsx (basic preview)
Phase 1.3: Import & Export (Week 5-6)
text
→ ImportWizard.tsx (CSV with preview)
→ Export options (JSON, basic CSV)
→ TemplateGallery.tsx (3 basic templates)
Phase 1.4: Polish & Launch (Week 7-8)
text
→ ModifierGroupBuilder.tsx
→ PublishManager.tsx
→ Performance optimization
→ Complete testing suite
🚨 Critical Questions You Need to Answer
Data Persistence: How often does auto-save trigger? What happens on browser close?

Collaboration: Can multiple admins edit simultaneously? Need locking mechanism?

Performance Baseline: What's the maximum template size you'll support?

Migration Path: How will you migrate existing JSON templates to the new builder?

Rollback Strategy: If a bad template gets published, how quickly can you revert?

💡 Quick Wins to Add
"Duplicate Item" button in ItemEditor

Bulk edit for prices across category

Template snippets (save a modifier group for reuse)

Keyboard shortcuts (Ctrl+D duplicate, Ctrl+S save)

Template health score (completeness indicator)

📊 Success Metrics to Track from Day 1
typescript
// Add analytics to track:
const BUILDER_METRICS = {
  timeToFirstTemplate: 'Time from blank to published',
  completionRate: 'Percentage who finish vs abandon',
  mostUsedFeatures: 'Which import method is popular?',
  errorFrequency: 'Where do users get stuck?',
  templateSize: 'Average items per template',
};
Final Recommendation
Your plan is 80% there. The biggest gaps are:

Publishing workflow (critical for production use)

Modifier builder (essential for fast food)

Error recovery (users WILL make mistakes)

Performance planning (templates can get large)

Next step: Create a detailed component interface spec for ModifierGroupBuilder.tsx and PublishManager.tsx before starting development. These are complex components that need clear UX patterns.

Would you like me to draft the detailed component specs for these missing pieces?

yes draft detailed component specs
Detailed Component Specifications
📦 1. ModifierGroupBuilder.tsx
Overview
A comprehensive interface for creating and managing modifier groups with nested options, pricing rules, and visual hierarchy.

Props Interface
typescript
interface ModifierGroupBuilderProps {
  templateId: string;
  initialGroups?: ModifierGroup[];
  onGroupsChange: (groups: ModifierGroup[]) => void;
  onValidationChange?: (isValid: boolean) => void;
  readOnly?: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  description: string;
  type: 'EXCLUSION' | 'ADDON' | 'CHOICE' | 'SIDE';
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  selectionMode: 'SINGLE' | 'MULTIPLE';
  options: ModifierOption[];
  visibilityRules?: VisibilityRule[];
  pricingStrategy?: 'PER_OPTION' | 'TIERED' | 'BUNDLE';
  uiConfig?: {
    displayStyle: 'RADIO' | 'CHECKBOX' | 'DROPDOWN' | 'BUTTON_GROUP';
    columns?: number;
    showImages?: boolean;
  };
}

interface ModifierOption {
  id: string;
  name: string;
  description?: string;
  priceAdjustment: number;
  isDefault: boolean;
  availabilityRules?: {
    timeBased?: TimeRange[];
    dayOfWeek?: DayOfWeek[];
    minimumOrderAmount?: number;
  };
  nestedModifiers?: ModifierGroup[]; // For nested groups
}

interface VisibilityRule {
  condition: {
    targetGroupId: string;
    targetOptionIds: string[];
    operator: 'INCLUDES' | 'EXCLUDES' | 'EQUALS';
  };
  action: 'SHOW' | 'HIDE' | 'REQUIRE';
}
Component Structure
text
ModifierGroupBuilder
├── Header
│   ├── Title with count badge
│   ├── Quick Actions dropdown
│   │   ├── "Add Standard Group" (Exclusions, Add-ons, Sizes)
│   │   ├── "Duplicate Selected"
│   │   └── "Import from CSV"
│   └── Toggle: Simple/Advanced View
├── ModifierGroupList (Sortable)
│   ├── ModifierGroupCard (Draggable)
│   │   ├── GroupHeader (with collapse/expand)
│   │   ├── BasicSettings (Inline form)
│   │   ├── OptionsList (with drag to reorder)
│   │   │   └── OptionRow (with price, default toggle)
│   │   ├── NestedModifiersPanel (if any)
│   │   └── RulesPanel (for visibility/availability)
│   └── "Add Modifier Group" Card
├── PreviewPanel (Right sidebar)
│   ├── Live preview of selected group
│   ├── Validation errors/warnings
│   └── Price calculator
└── Footer
    ├── Summary stats (e.g., "3 groups, 12 options")
    ├── Validation status indicator
    └── "Save & Continue" button
Key Features
1. Visual Group Management
tsx
// Drag-and-drop with visual feedback
<DraggableGroupList
  groups={groups}
  onReorder={handleReorder}
  onGroupSelect={handleGroupSelect}
  selectedGroupId={selectedGroupId}
/>

// Quick template buttons
<TemplateButtons>
  <TemplateButton 
    icon="🚫" 
    label="Exclusions" 
    onClick={() => addStandardGroup('EXCLUSION')}
  />
  <TemplateButton 
    icon="➕" 
    label="Add-ons" 
    onClick={() => addStandardGroup('ADDON')}
  />
  <TemplateButton 
    icon="📏" 
    label="Sizes" 
    onClick={() => addStandardGroup('CHOICE')}
  />
</TemplateButtons>
2. Advanced Option Editor
tsx
<OptionEditor
  option={selectedOption}
  onChange={handleOptionChange}
  showAdvanced={showAdvancedSettings}
>
  <BasicFields>
    <Input label="Option Name" required />
    <PriceInput 
      label="Price Adjustment" 
      prefix="+" 
      allowNegative={true}
    />
    <Toggle label="Default Selection" />
  </BasicFields>
  
  <AdvancedSection>
    <TimeBasedAvailability
      days={['MON', 'TUE', 'WED', 'THU', 'FRI']}
      timeRanges={[{ start: '11:00', end: '14:00' }]}
    />
    <MinimumOrderAmount minAmount={20} />
    <ImageUpload 
      aspectRatio="1:1" 
      maxSize={500}
    />
  </AdvancedSection>
</OptionEditor>
3. Rule Builder with Visual Flow
tsx
<RuleBuilder>
  <ConditionBuilder>
    <RuleStatement>
      <Select value="IF">IF</Select>
      <Select options={groups} label="Group" />
      <Select options={['includes', 'excludes']} />
      <Select options={options} label="Option(s)" multiple />
    </RuleStatement>
  </ConditionBuilder>
  
  <ActionBuilder>
    <Select options={['SHOW', 'HIDE', 'REQUIRE']} label="THEN" />
    <Select options={groups} label="This group" />
  </ActionBuilder>
  
  <RulePreview>
    "IF Burger Size includes 'Large' THEN SHOW Cheese Options"
  </RulePreview>
</RuleBuilder>
4. Nested Modifiers Support
tsx
<NestedModifiersPanel parentGroupId={selectedGroupId}>
  <Alert>Options with nested modifiers: 2</Alert>
  <NestedGroupList>
    {nestedGroups.map(group => (
      <CompactGroupCard 
        group={group}
        onEdit={handleEditNested}
        depth={1}
      />
    ))}
  </NestedGroupList>
  <Button 
    variant="outline"
    onClick={addNestedGroup}
  >
    Add Nested Group
  </Button>
</NestedModifiersPanel>
5. Live Preview & Testing
tsx
<ModifierPreview>
  <PreviewHeader>
    <Select value="tablet" options={['tablet', 'mobile', 'kiosk']} />
    <Button onClick={testFlow}>Test Flow</Button>
  </PreviewHeader>
  
  <PreviewCanvas>
    <MockPOSScreen>
      <CategoryButton>Burgers</CategoryButton>
      <ItemCard>
        <ItemHeader>Classic Burger $5.99</ItemHeader>
        {selectedGroup && (
          <ModifierSection>
            <SectionTitle>{selectedGroup.name} *</SectionTitle>
            {selectedGroup.options.map(option => (
              <ModifierOption>
                <Checkbox />
                <OptionLabel>{option.name}</OptionLabel>
                <OptionPrice>+{option.priceAdjustment}</OptionPrice>
              </ModifierOption>
            ))}
          </ModifierSection>
        )}
      </ItemCard>
    </MockPOSScreen>
  </PreviewCanvas>
</ModifierPreview>
State Management
typescript
interface ModifierBuilderState {
  groups: ModifierGroup[];
  selectedGroupId: string | null;
  selectedOptionId: string | null;
  draftChanges: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  validation: {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    isValid: boolean;
  };
  ui: {
    viewMode: 'SIMPLE' | 'ADVANCED';
    expandedGroups: string[];
    showPreview: boolean;
    previewDevice: 'TABLET' | 'MOBILE' | 'KITCHEN';
  };
}

const validationRules = {
  requiredGroups: (groups) => groups.length > 0,
  optionNames: (groups) => 
    groups.every(g => g.options.every(o => o.name.trim().length > 0)),
  pricingLogic: (groups) => 
    !groups.some(g => g.options.some(o => 
      o.priceAdjustment < -100 || o.priceAdjustment > 100
    )),
  nestedDepth: (groups) => 
    getMaxNestedDepth(groups) <= 3,
};
User Interactions
Drag to reorder groups and options

Double-click to quick edit names

Right-click context menu on groups/options

Keyboard shortcuts:

Ctrl+D - Duplicate selected

Ctrl+Shift+N - New nested group

Ctrl+Arrow - Move selection

Delete - Remove selected

Bulk operations:

Select multiple options → Apply price change to all

Copy options between groups

Convert group type (exclusion → add-on)

Validation & Error States
tsx
<ValidationPanel>
  {validation.errors.map(error => (
    <ValidationError
      type="error"
      message={error.message}
      fixAction={error.fixAction}
      location={error.location}
    />
  ))}
  
  {validation.warnings.map(warning => (
    <ValidationWarning
      message={warning.message}
      suggestion={warning.suggestion}
    />
  ))}
  
  <ValidationSummary>
    <Progress 
      value={completionPercentage} 
      label={`${groups.length} groups, ${totalOptions} options`}
    />
  </ValidationSummary>
</ValidationPanel>
Responsive Behavior
Desktop: Full sidebar + preview layout

Tablet: Collapsible panels

Mobile: Single panel at a time with bottom navigation

📦 2. PublishManager.tsx
Overview
Complete workflow for reviewing, validating, scheduling, and deploying template changes with rollback capability.

Props Interface
typescript
interface PublishManagerProps {
  templateId: string;
  draftVersion: TemplateVersion;
  publishedVersion?: TemplateVersion;
  locations?: StoreLocation[]; // For multi-location deployment
  onPublish: (options: PublishOptions) => Promise<PublishResult>;
  onSchedule: (schedule: ScheduleOptions) => Promise<ScheduleResult>;
  onRollback?: (versionId: string) => Promise<RollbackResult>;
  onCancel?: () => void;
}

interface PublishOptions {
  versionId: string;
  publishNotes?: string;
  notifyUsers?: boolean;
  deploymentStrategy: 'IMMEDIATE' | 'SCHEDULED' | 'PHASED';
  targetLocations?: string[]; // All if empty
  validationLevel: 'BASIC' | 'STRICT' | 'CUSTOM';
}

interface ScheduleOptions {
  publishAt: Date;
  timezone: string;
  notifyBefore?: number; // minutes before
  autoRetry?: boolean;
  maxAttempts?: number;
}
Component Structure
text
PublishManager
├── Header
│   ├── Template name and version badge
│   ├── Publish status indicator
│   └── Close/Cancel button
├── Main Content (Tabbed Interface)
│   ├── Tab 1: Review & Validate
│   │   ├── ValidationChecklist
│   │   ├── DiffViewer (changes vs current)
│   │   └── ImpactAnalysis
│   ├── Tab 2: Deployment Options
│   │   ├── StrategySelector (Immediate/Scheduled/Phased)
│   │   ├── LocationSelector (for multi-location)
│   │   └── NotificationSettings
│   ├── Tab 3: Preview & Test
│   │   ├── DevicePreviewTabs
│   │   ├── OrderSimulator
│   │   └── ReceiptPreview
│   └── Tab 4: Publish Summary
│       ├── DeploymentTimeline
│       ├── RiskAssessment
│       └── Confirmation
├── Action Footer
│   ├── Back/Save Draft buttons
│   ├── Schedule/Publish buttons
│   └── Status indicators
└── (Modal) RollbackInterface
    └── Version history with rollback options
Detailed Component Specifications
Tab 1: Review & Validate
ValidationChecklist Component:

tsx
<ValidationChecklist
  template={draftVersion}
  onValidate={runValidations}
  autoValidate={true}
>
  <ChecklistSection title="Required Configuration" required>
    <ChecklistItem
      id="pricing"
      label="All items have prices"
      status={validationResults.pricing ? 'PASS' : 'FAIL'}
      details="5 items missing prices"
      fixAction={() => navigateToItems()}
    />
    <ChecklistItem
      id="tax"
      label="Tax settings configured"
      status={validationResults.tax ? 'PASS' : 'WARN'}
      details="Using default tax rate"
    />
    <ChecklistItem
      id="images"
      label="Featured items have images"
      status={validationResults.images ? 'PASS' : 'INFO'}
      details="12/20 items have images"
    />
  </ChecklistSection>
  
  <ChecklistSection title="Business Rules">
    <ChecklistItem
      id="modifiers"
      label="Required modifiers configured"
      status={validationResults.modifiers}
    />
    <ChecklistItem
      id="allergens"
      label="Allergen warnings present"
      status={validationResults.allergens}
    />
    <ChecklistItem
      id="availability"
      label="Time-based availability set"
      status={validationResults.availability}
    />
  </ChecklistSection>
  
  <ChecklistSection title="Performance">
    <ChecklistItem
      id="load_time"
      label="Template loads in < 2s"
      status={validationResults.performance}
      details="Estimated load: 1.4s"
    />
    <ChecklistItem
      id="size"
      label="Template size < 100KB"
      status={validationResults.size}
      details="Current: 84KB"
    />
  </ChecklistSection>
  
  <ValidationScore>
    <ScoreBadge score={validationScore} max={100} />
    <Progress value={completionPercentage} />
    {validationScore < 80 && (
      <Alert type="warning">
        Score below recommended threshold (80%)
      </Alert>
    )}
  </ValidationScore>
</ValidationChecklist>
DiffViewer Component:

tsx
<DiffViewer
  oldVersion={publishedVersion}
  newVersion={draftVersion}
  viewMode="SIDE_BY_SIDE" | "UNIFIED" | "INLINE"
  filters={{
    changeTypes: ['ADDED', 'MODIFIED', 'DELETED'],
    components: ['CATEGORIES', 'ITEMS', 'MODIFIERS'],
    severity: ['BREAKING', 'NON_BREAKING'],
  }}
>
  <DiffSection title="Categories">
    <DiffItem
      type="ADDED"
      path="categories[3]"
      oldValue={null}
      newValue="Breakfast Menu"
      breaking={false}
    />
    <DiffItem
      type="MODIFIED"
      path="categories[0].name"
      oldValue="Burgers & Sandwiches"
      newValue="Burgers"
      breaking={true}
    />
  </DiffSection>
  
  <DiffSection title="Pricing Changes">
    <PriceChangeList>
      {priceChanges.map(change => (
        <PriceChangeItem
          item={change.itemName}
          oldPrice={change.oldPrice}
          newPrice={change.newPrice}
          percentage={change.percentageChange}
          breaking={change.percentageChange > 0.1}
        />
      ))}
    </PriceChangeList>
  </DiffSection>
  
  <ImpactSummary>
    <ImpactMetric
      label="Breaking Changes"
      value={breakingChangesCount}
      threshold={3}
      icon="⚠️"
    />
    <ImpactMetric
      label="Affected Items"
      value={affectedItemsCount}
      percentage={affectedItemsPercentage}
    />
    <ImpactMetric
      label="Price Increase Avg."
      value={`+${averagePriceIncrease}%`}
      trend="up"
    />
  </ImpactSummary>
</DiffViewer>
Tab 2: Deployment Options
StrategySelector Component:

tsx
<StrategySelector
  value={deploymentStrategy}
  onChange={setDeploymentStrategy}
>
  <StrategyCard
    value="IMMEDIATE"
    title="Publish Immediately"
    icon="⚡"
    description="Deploy to all locations now"
    pros={['Instant update', 'Simple']}
    cons={['No gradual rollout', 'Higher risk']}
    recommendedFor="Small changes, off-peak hours"
  />
  
  <StrategyCard
    value="SCHEDULED"
    title="Schedule for Later"
    icon="📅"
    description="Set specific date/time"
    pros={['Control timing', 'Prepare staff']}
    cons={['Delayed deployment']}
    recommendedFor="Large changes, business hours"
  >
    <DateTimePicker
      value={scheduledTime}
      onChange={setScheduledTime}
      minDate={new Date()}
      suggestedTimes={[
        { label: 'Tonight (2 AM)', value: '02:00' },
        { label: 'Tomorrow Open', value: '08:00' },
        { label: 'Next Monday', value: 'mon-08:00' },
      ]}
      timezone={storeTimezone}
    />
  </StrategyCard>
  
  <StrategyCard
    value="PHASED"
    title="Phased Rollout"
    icon="📊"
    description="Deploy to locations gradually"
    pros={['Monitor impact', 'Rollback if issues']}
    cons={['Complex setup', 'Multiple deployments']}
    recommendedFor="Major changes, multi-location"
  >
    <PhaseBuilder>
      <Phase phase={1} percentage={25}>
        <LocationSelector
          locations={locations}
          selected={phase1Locations}
          maxSelections={locations.length * 0.25}
          criteria={['Low traffic', 'Test location']}
        />
        <DurationInput
          label="Monitor for"
          value="24 hours"
          unit="hours"
        />
      </Phase>
      <Phase phase={2} percentage={50}>
        {/* Additional locations */}
      </Phase>
      <Phase phase={3} percentage={100}>
        {/* Remaining locations */}
      </Phase>
    </PhaseBuilder>
  </StrategyCard>
</StrategySelector>
LocationSelector Component (for multi-location):

tsx
<LocationSelector
  locations={locations}
  selected={selectedLocations}
  onSelectionChange={setSelectedLocations}
  selectionMode="ALL" | "CUSTOM" | "CRITERIA"
>
  <LocationList>
    {locations.map(location => (
      <LocationCard
        location={location}
        isSelected={selectedLocations.includes(location.id)}
        status={getLocationStatus(location.id)}
        lastDeployed={location.lastDeployed}
        trafficLevel={location.trafficLevel}
        issues={location.recentIssues}
      >
        <Checkbox 
          checked={isSelected}
          disabled={location.status === 'MAINTENANCE'}
        />
        <LocationInfo>
          <LocationName>{location.name}</LocationName>
          <LocationMeta>
            <Badge>{location.posSystem}</Badge>
            <TrafficIndicator level={location.trafficLevel} />
            {location.recentIssues > 0 && (
              <WarningBadge count={location.recentIssues} />
            )}
          </LocationMeta>
        </LocationInfo>
        <LocationActions>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => previewAtLocation(location.id)}
          >
            Preview
          </Button>
        </LocationActions>
      </LocationCard>
    ))}
  </LocationList>
  
  <SelectionSummary>
    <SummaryItem>
      <strong>{selectedLocations.length}</strong> of {locations.length} locations
    </SummaryItem>
    <SummaryItem>
      <strong>{coveragePercentage}%</strong> coverage
    </SummaryItem>
    {hasHighTrafficLocations && (
      <Alert type="warning">
        Includes {highTrafficCount} high-traffic locations
      </Alert>
    )}
  </SelectionSummary>
</LocationSelector>
Tab 3: Preview & Test
OrderSimulator Component:

tsx
<OrderSimulator
  template={draftVersion}
  deviceType={previewDevice}
  onTestComplete={handleTestComplete}
>
  <SimulatorHeader>
    <DeviceTabs>
      <Tab value="customer">Customer POS</Tab>
      <Tab value="kitchen">Kitchen Display</Tab>
      <Tab value="kiosk">Self-Service Kiosk</Tab>
      <Tab value="mobile">Mobile App</Tab>
    </DeviceTabs>
    <TestScenarios>
      <Select
        options={[
          { label: 'Simple Order', value: 'simple' },
          { label: 'Complex Modifiers', value: 'complex' },
          { label: 'Combo Meal', value: 'combo' },
          { label: 'Allergen Test', value: 'allergen' },
        ]}
        value={testScenario}
        onChange={setTestScenario}
      />
      <Button onClick={runAutomatedTest}>Run Test Suite</Button>
    </TestScenarios>
  </SimulatorHeader>
  
  <SimulatorBody>
    <MockDevice device={previewDevice}>
      {/* Renders appropriate mock interface */}
      {previewDevice === 'customer' && <MockCustomerPOS />}
      {previewDevice === 'kitchen' && <MockKitchenDisplay />}
      {previewDevice === 'kiosk' && <MockKioskInterface />}
    </MockDevice>
    
    <TestPanel>
      <TestStep 
        step={1} 
        title="Select Category" 
        status="COMPLETE"
      />
      <TestStep 
        step={2} 
        title="Choose Item" 
        status="COMPLETE"
      />
      <TestStep 
        step={3} 
        title="Apply Modifiers" 
        status="IN_PROGRESS"
      >
        <ModifierTest
          group={selectedModifierGroup}
          selections={currentSelections}
          onSelectionChange={handleSelectionChange}
        />
      </TestStep>
      <TestStep step={4} title="Checkout" status="PENDING" />
      
      <TestResults>
        <ResultItem label="Order Total" value="$12.49" />
        <ResultItem label="Tax Calculated" value="$1.12" />
        <ResultItem label="Items in Order" value="3" />
        <ResultItem label="Modifiers Applied" value="5" />
      </TestResults>
    </TestPanel>
  </SimulatorBody>
</OrderSimulator>
Tab 4: Publish Summary
DeploymentTimeline Component:

tsx
<DeploymentTimeline
  strategy={deploymentStrategy}
  scheduledTime={scheduledTime}
  estimatedDuration={estimatedDuration}
>
  <TimelineEvent
    time="Now"
    title="Validation Complete"
    status="COMPLETE"
    icon="✅"
  />
  
  {deploymentStrategy === 'SCHEDULED' && (
    <TimelineEvent
      time={formatTime(scheduledTime)}
      title="Scheduled Deployment"
      status="SCHEDULED"
      icon="📅"
    >
      <CountdownTimer target={scheduledTime} />
    </TimelineEvent>
  )}
  
  {deploymentStrategy === 'PHASED' && (
    <>
      <TimelineEvent
        time="Phase 1"
        title="Deploy to 25% locations"
        status="PENDING"
        icon="🚀"
        details={`${phase1Locations.length} locations`}
      />
      <TimelineEvent
        time="+24 hours"
        title="Monitor & Assess"
        status="PENDING"
        icon="👁️"
      />
      <TimelineEvent
        time="Phase 2"
        title="Deploy to 50% locations"
        status="PENDING"
        icon="🚀"
      />
    </>
  )}
  
  <TimelineEvent
    time="Completion"
    title="All locations updated"
    status="PENDING"
    icon="🏁"
    estimatedDuration={estimatedDuration}
  />
</DeploymentTimeline>
RiskAssessment Component:

tsx
<RiskAssessment
  changes={changes}
  deploymentStrategy={deploymentStrategy}
  locations={selectedLocations}
>
  <RiskMatrix>
    <RiskLevel level="LOW" count={lowRiskItems}>
      Minor text changes, image updates
    </RiskLevel>
    <RiskLevel level="MEDIUM" count={mediumRiskItems}>
      Price changes < 10%, new items
    </RiskLevel>
    <RiskLevel level="HIGH" count={highRiskItems}>
      Breaking changes, major price changes
    </RiskLevel>
    <RiskLevel level="CRITICAL" count={criticalRiskItems}>
      Tax changes, modifier structure changes
    </RiskLevel>
  </RiskMatrix>
  
  <RiskMitigation>
    <MitigationItem
      risk="High traffic disruption"
      mitigation="Schedule during off-peak hours"
      implemented={deploymentStrategy === 'SCHEDULED'}
    />
    <MitigationItem
      risk="POS system errors"
      mitigation="Deploy to test location first"
      implemented={deploymentStrategy === 'PHASED'}
    />
    <MitigationItem
      risk="Staff confusion"
      mitigation="Send notification 24h before"
      implemented={notifyStaff}
    />
    <MitigationItem
      risk="Rollback needed"
      mitigation="Automatic rollback if > 5% error rate"
      implemented={autoRollbackEnabled}
    />
  </RiskMitigation>
  
  <OverallRiskScore>
    <RiskScore value={overallRisk} max={10} />
    <Recommendation>
      {overallRisk <= 3 && '✅ Safe to deploy'}
      {overallRisk <= 6 && '⚠️ Recommend scheduled deployment'}
      {overallRisk > 6 && '🚨 Consider phased rollout or further testing'}
    </Recommendation>
  </OverallRiskScore>
</RiskAssessment>
Rollback Interface (Modal)
tsx
<RollbackModal
  isOpen={showRollback}
  onClose={() => setShowRollback(false)}
  templateId={templateId}
  currentVersion={publishedVersion}
  onRollback={handleRollback}
>
  <VersionHistory>
    {versions.map(version => (
      <VersionCard
        version={version}
        isCurrent={version.id === publishedVersion?.id}
        isRollbackTarget={version.id === rollbackTarget}
        onSelect={setRollbackTarget}
      >
        <VersionHeader>
          <VersionNumber>v{version.number}</VersionNumber>
          <VersionDate>{formatDate(version.createdAt)}</VersionDate>
          <Badge>{version.status}</Badge>
          {version.publishNotes && (
            <NotesPreview>{version.publishNotes}</NotesPreview>
          )}
        </VersionHeader>
        
        <VersionChanges>
          <ChangeSummary>
            {version.changeSummary.categories.added > 0 && (
              <ChangeBadge type="added">
                +{version.changeSummary.categories.added} categories
              </ChangeBadge>
            )}
            {version.changeSummary.items.modified > 0 && (
              <ChangeBadge type="modified">
                {version.changeSummary.items.modified} items changed
              </ChangeBadge>
            )}
          </ChangeSummary>
          
          <RollbackImpact>
            <ImpactItem>
              <strong>Rolling back will:</strong>
            </ImpactItem>
            {getRollbackImpact(version).map(impact => (
              <ImpactItem>{impact}</ImpactItem>
            ))}
          </RollbackImpact>
        </VersionChanges>
        
        <VersionActions>
          <Button
            variant="outline"
            onClick={() => previewVersion(version.id)}
          >
            Preview
          </Button>
          <Button
            variant={version.id === rollbackTarget ? 'primary' : 'outline'}
            onClick={() => setRollbackTarget(version.id)}
            disabled={version.id === publishedVersion?.id}
          >
            Select for Rollback
          </Button>
        </VersionActions>
      </VersionCard>
    ))}
  </VersionHistory>
  
  {rollbackTarget && (
    <RollbackConfirmation
      fromVersion={publishedVersion}
      toVersion={rollbackTarget}
      onConfirm={() => confirmRollback(rollbackTarget)}
      onCancel={() => setRollbackTarget(null)}
    />
  )}
</RollbackModal>
Action Footer
tsx
<PublishFooter>
  <FooterLeft>
    <Button 
      variant="ghost" 
      onClick={onCancel}
    >
      Cancel
    </Button>
    <Button 
      variant="outline"
      onClick={saveAsDraft}
      disabled={isPublishing}
    >
      Save as Draft
    </Button>
  </FooterLeft>
  
  <FooterCenter>
    <PublishStatus>
      {publishStatus === 'IDLE' && 'Ready to publish'}
      {publishStatus === 'VALIDATING' && 'Validating...'}
      {publishStatus === 'SCHEDULING' && 'Scheduling...'}
      {publishStatus === 'PUBLISHING' && 'Publishing...'}
      {publishStatus === 'SUCCESS' && 'Published successfully!'}
      {publishStatus === 'ERROR' && 'Error publishing'}
    </PublishStatus>
    {estimatedTime > 0 && (
      <Estimation>
        Estimated: {estimatedTime} seconds
      </Estimation>
    )}
  </FooterCenter>
  
  <FooterRight>
    {deploymentStrategy === 'SCHEDULED' ? (
      <Button
        variant="primary"
        onClick={schedulePublish}
        disabled={!canPublish || isPublishing}
        loading={isPublishing}
      >
        <CalendarIcon />
        Schedule for {formatTime(scheduledTime)}
      </Button>
    ) : (
      <Button
        variant="primary"
        onClick={confirmPublish}
        disabled={!canPublish || isPublishing}
        loading={isPublishing}
      >
        <RocketIcon />
        Publish Now
      </Button>
    )}
    
    {hasRollback && (
      <Button
        variant="outline"
        onClick={() => setShowRollback(true)}
      >
        Rollback
      </Button>
    )}
  </FooterRight>
</PublishFooter>
State Management for PublishManager
typescript
interface PublishManagerState {
  // Current state
  activeTab: 'review' | 'deploy' | 'test' | 'summary';
  deploymentStrategy: 'IMMEDIATE' | 'SCHEDULED' | 'PHASED';
  
  // Deployment configuration
  selectedLocations: string[];
  scheduledTime: Date | null;
  phaseConfig: PhaseConfig[];
  notificationSettings: NotificationSettings;
  
  // Validation
  validationResults: ValidationResults;
  validationScore: number;
  validationErrors: ValidationError[];
  
  // Testing
  testScenario: string;
  testResults: TestResults;
  previewDevice: DeviceType;
  
  // Publishing
  publishStatus: 'IDLE' | 'VALIDATING' | 'PUBLISHING' | 'SUCCESS' | 'ERROR';
  publishProgress: number;
  publishNotes: string;
  
  // Rollback
  rollbackTarget: string | null;
  showRollbackModal: boolean;
  
  // UI state
  expandedSections: string[];
  autoValidate: boolean;
  showAdvancedOptions: boolean;
}

interface PhaseConfig {
  phase: number;
  percentage: number;
  locationIds: string[];
  durationHours: number;
  conditions: {
    errorRateThreshold: number;
    requireManualApproval: boolean;
  };
}
Key User Interactions
One-click publish with smart defaults

Schedule for later with calendar picker

Phased rollout with visual phase builder

Test before publish with order simulator

Risk assessment with mitigation suggestions

Rollback interface with version comparison

Validation Flow
typescript
const publishValidation = async () => {
  // 1. Schema validation
  const schemaValid = validateAgainstSchema(draftVersion);
  
  // 2. Business rule validation
  const businessRulesValid = validateBusinessRules(draftVersion);
  
  // 3. Performance validation
  const performanceValid = await validatePerformance(draftVersion);
  
  // 4. Compatibility validation
  const compatibilityValid = validateCompatibility(
    draftVersion, 
    targetLocations
  );
  
  // 5. Risk assessment
  const riskLevel = assessRisk(draftVersion, publishedVersion);
  
  return {
    canPublish: schemaValid && businessRulesValid && 
                performanceValid && compatibilityValid,
    validationScore: calculateScore(...),
    risks: riskLevel,
    warnings: [...],
  };
};
Responsive Design
Desktop: Multi-tab interface with side-by-side preview

Tablet: Single column with expandable sections

Mobile: Step-by-step wizard format

Error States & Recovery
tsx
<PublishErrorBoundary>
  {publishStatus === 'ERROR' && (
    <ErrorRecovery
      error={lastError}
      onRetry={retryPublish}
      onPartialDeploy={handlePartialDeploy}
      onCancel={handleCancelPublish}
    >
      <ErrorDetails error={lastError} />
      <RetryOptions>
        <RetryOption
          label="Retry immediately"
          description="Try publishing again"
          onClick={retryPublish}
        />
        <RetryOption
          label="Schedule for later"
          description="Try again in 15 minutes"
          onClick={() => scheduleRetry(15)}
        />
        <RetryOption
          label="Deploy to test location only"
          description="Isolate the issue"
          onClick={deployToTestOnly}
        />
      </RetryOptions>
    </ErrorRecovery>
  )}
</PublishErrorBoundary>