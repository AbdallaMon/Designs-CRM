import { AutoCompleteSelector } from "@/app/UiComponents/DataViewer/image-session/admin/shared/session-item/AutoCompleteSelector.jsx";

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
