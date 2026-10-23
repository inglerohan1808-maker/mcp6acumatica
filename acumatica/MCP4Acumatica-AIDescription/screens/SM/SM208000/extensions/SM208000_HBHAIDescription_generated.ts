import {
  PXFieldState,
  PXFieldOptions,
  PXView,
  updateDecorator,
  removeDecorator,
  featureInstalled,
  FeaturesSet,
  placeBeforeView,
  placeAfterView,
  placeBeforeProperty,
  placeAfterProperty,
  graphInfo,
  viewInfo,
  gridConfig,
  columnConfig,
  treeConfig,
  controlConfig,
  linkCommand,
  fieldOptions,
  fieldConfig,
  fieldInfo,
  headerDescription,
  autoRefresh,
  mappedToViewField,
  suppressLabel,
  readOnly,
  disabled,
  unbound,
  text,
  multiLine,
  primaryKey,
  type,
  ControlParameter,
  NetType,
  MenuItemRenderType,
  ScrollMode,
  TextAlign,
  GridPreset,
  GridColumnType,
  GridColumnShowHideMode,
  GridColumnDisplayMode,
  GridAutoGrowMode,
  GridPagerMode,
  GridFastFilterVisibility,
  GridNoteFilesShowMode,
  HeaderDescription,
  GridColumnGeneration,
  GridFilterBarVisibility,
  NodeSelectMode,
  PXSelectorMode,
  ApplySuggestionMode,
  ITextEditorControlConfig,
  ITimeSpanConfig,
  ISelectorControlConfig,
  ISegmentedSelectorControlConfig,
  IEditorControlConfig,
  INumberEditorControlConfig,
  IMaskEditorControlConfig,
  IMailEditorControlConfig,
  ILinkEditorControlConfig,
  IDropDownConfig,
  IDatetimeEditControlConfig,
  IColorPickerControlConfig,
  ICheckBoxControlConfig,
  ICalendarControlConfig,
  IBranchSelectorConfig,
  IBarcodeInputControlConfig,
  ITreeSelectorConfig,
  IRichTextEditorConfig,
  IFormulaEditorConfig,
  ICurrencyControlConfig,
  FieldGenerationMode,
} from "client-controls";
import { SM208000 } from "src/screens/SM/SM208000/SM208000";
import { GIDesign2, GIResult } from "src/screens/SM/SM208000/views";

export interface SM208000_HBHAIDescription_generated extends SM208000 {}
export class SM208000_HBHAIDescription_generated {}

export interface GIDesign2_HBHAIDescription_generated extends GIDesign2 {}
export class GIDesign2_HBHAIDescription_generated {
  UsrExposedToMCP: PXFieldState;

  UsrAIDescription: PXFieldState;
}

export interface GIResult_HBHAIDescription_generated extends GIResult {}
export class GIResult_HBHAIDescription_generated {
  UsrResAIDescription: PXFieldState;
}
