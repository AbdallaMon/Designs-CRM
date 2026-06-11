import { AutoCompleteSelector } from "./session-item/AutoCompleteSelector";

export const TemplateAutocomplete = ({
  onTemplateSelect,
  type,
  initialData,
  isFullWidth,
}) => {
  return (
    <AutoCompleteSelector
      initialData={initialData}
      onSelect={onTemplateSelect}
      slug="templates"
      keyId="templateId"
      model="Template"
      select={"id"}
      where={{ type }}
      isFullWidth={isFullWidth}
    />
  );
};
