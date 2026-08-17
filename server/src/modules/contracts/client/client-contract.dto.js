function mapStage(stage) {
  return {
    id: stage.id,
    title: stage.title,
    order: stage.order,
    deliveryDays: stage.deliveryDays,
    stageStatus: stage.stageStatus,
  };
}

function mapPayment(payment) {
  return {
    id: payment.id,
    amount: payment.amount,
    conditionItem: payment.conditionItem
      ? {
          labelAr: payment.conditionItem.labelAr,
          labelEn: payment.conditionItem.labelEn,
        }
      : null,
  };
}

export function toPublicContractSession(contract) {
  if (!contract) return null;
  return {
    id: contract.id,
    arToken: contract.arToken,
    sessionStatus: contract.sessionStatus,
    pdfLinkAr: contract.pdfLinkAr,
    pdfLinkEn: contract.pdfLinkEn,
    title: contract.title,
    enTitle: contract.enTitle,
    amount: contract.amount,
    taxRate: contract.taxRate,
    totalAmount: contract.totalAmount,
    stages: (contract.stages || []).map(mapStage),
    paymentsNew: (contract.paymentsNew || []).map(mapPayment),
    drawings: (contract.drawings || []).map((drawing) => ({
      id: drawing.id,
      url: drawing.url,
      fileName: drawing.fileName,
    })),
    specialItems: (contract.specialItems || []).map((item) => ({
      id: item.id,
      labelAr: item.labelAr,
      labelEn: item.labelEn,
    })),
    clientLead: contract.clientLead
      ? {
          id: contract.clientLead.id,
          code: contract.clientLead.code,
          emirate: contract.clientLead.emirate,
          country: contract.clientLead.country,
          client: contract.clientLead.client
            ? {
                name: contract.clientLead.client.name,
                arName: contract.clientLead.client.arName,
                enName: contract.clientLead.client.enName,
                phone: contract.clientLead.client.phone,
                email: contract.clientLead.client.email,
              }
            : null,
        }
      : null,
  };
}

export function toPublicContractUtility(contractUtility) {
  if (!contractUtility) return null;
  return {
    obligationsPartyOneAr: contractUtility.obligationsPartyOneAr,
    obligationsPartyOneEn: contractUtility.obligationsPartyOneEn,
    obligationsPartyTwoAr: contractUtility.obligationsPartyTwoAr,
    obligationsPartyTwoEn: contractUtility.obligationsPartyTwoEn,
    stageClauses: (contractUtility.stageClauses || []).map((clause) => ({
      headingAr: clause.headingAr,
      headingEn: clause.headingEn,
      titleAr: clause.titleAr,
      titleEn: clause.titleEn,
      descriptionAr: clause.descriptionAr,
      descriptionEn: clause.descriptionEn,
    })),
    specialClauses: (contractUtility.specialClauses || []).map((clause) => ({
      textAr: clause.textAr,
      textEn: clause.textEn,
    })),
    levelClauses: (contractUtility.levelClauses || []).map((clause) => ({
      level: clause.level,
      textAr: clause.textAr,
      textEn: clause.textEn,
    })),
  };
}
