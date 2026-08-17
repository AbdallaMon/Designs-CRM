export function mergeLeadFieldUpdate(currentLead, { field, section, updatedEntity }) {
  if (!currentLead) return currentLead;

  if (section) {
    return {
      ...currentLead,
      [section]: {
        ...currentLead[section],
        [field]: updatedEntity?.[field],
      },
    };
  }

  return {
    ...currentLead,
    [field]: updatedEntity?.[field],
  };
}

export function applyLeadFieldUpdate({
  leadId,
  field,
  section,
  updatedEntity,
  setLead,
  setLeads,
}) {
  setLead?.((currentLead) =>
    mergeLeadFieldUpdate(currentLead, { field, section, updatedEntity }),
  );
  setLeads?.((currentLeads) =>
    currentLeads.map((currentLead) =>
      currentLead.id === leadId
        ? mergeLeadFieldUpdate(currentLead, { field, section, updatedEntity })
        : currentLead,
    ),
  );
}
