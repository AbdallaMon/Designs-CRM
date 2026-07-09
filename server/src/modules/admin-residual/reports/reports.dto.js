// admin-residual/reports DTO — pure output shaping for the (NON-frozen) report DATA
// endpoints. `calculateSummary`, `processLeads` and `calculateStaffStats` are moved
// VERBATIM from the legacy `admin-services.js` god-file (no Prisma, no side effects).
import pkg from "lodash";
const { groupBy } = pkg;

export const calculateSummary = (leads) => {
  const totalLeads = leads.length;
  const totalValue = leads.reduce(
    (sum, lead) => sum + Number(lead.averagePrice || 0),
    0,
  );
  const totalDiscount = leads.reduce(
    (sum, lead) => sum + Number(lead.discount || 0),
    0,
  );

  return {
    totalLeads,
    totalValue,
    averageValue: totalLeads > 0 ? totalValue / totalLeads : 0,
    totalDiscount,
    byEmirate: groupBy(leads, "emirate"),
    byStatus: groupBy(leads, "status"),
    byType: groupBy(leads, "type"),
  };
};

export const processLeads = (leads) => {
  return leads.map((lead) => ({
    clientName: lead.client.name,
    clientPhone: lead.client.phone,
    status: lead.status,
    emirate: lead.emirate,
    type: lead.type,
    averagePrice: Number(lead.averagePrice || 0),
    discount: Number(lead.discount || 0),
    priceWithOutDiscount: Number(lead.priceWithOutDiscount || 0),
    createdAt: lead.createdAt.toISOString().split("T")[0],
    assignedTo: lead.assignedTo?.name || "Unassigned",
  }));
};

export const calculateStaffStats = (staff, dateRange) => {
  return staff.map((user) => {
    const userLeads = user.clientLeads || [];

    const filteredLeads =
      dateRange.startDate && dateRange.endDate
        ? userLeads.filter((lead) => {
            const leadDate = new Date(lead.createdAt);
            return (
              leadDate >= new Date(dateRange.startDate) &&
              leadDate <= new Date(dateRange.endDate)
            );
          })
        : userLeads;

    const totalLeads = filteredLeads.length;
    const finalized = filteredLeads.filter(
      (lead) => lead.status === "FINALIZED",
    ).length;
    const converted = filteredLeads.filter(
      (lead) => lead.status === "CONVERTED",
    ).length;
    const onHold = filteredLeads.filter(
      (lead) => lead.status === "ON_HOLD",
    ).length;
    const rejected = filteredLeads.filter(
      (lead) => lead.status === "REJECTED",
    ).length;
    // Calculate success rate
    const totalClosedLeads = finalized + converted + rejected + onHold;
    const successRate =
      totalClosedLeads > 0
        ? parseFloat(
            (
              ((finalized - (converted + rejected + onHold)) /
                totalClosedLeads) *
              100
            ).toFixed(2),
          )
        : 0.0;

    // Calculate revenue and discount
    const totalRevenue = filteredLeads
      .filter((lead) => lead.status === "FINALIZED")
      .reduce(
        (sum, lead) =>
          sum + parseFloat(Number(lead.averagePrice || 0).toFixed(2)),
        0,
      );

    // Calculate discount
    const totalDiscount = filteredLeads
      .filter((lead) => lead.status === "FINALIZED")
      .reduce(
        (sum, lead) => sum + parseFloat(Number(lead.discount || 0).toFixed(2)),
        0,
      );

    // Calculate conversion rate
    const conversionRate =
      totalLeads > 0
        ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
        : 0.0;
    const totalCommission = parseFloat((totalRevenue * 0.05).toFixed(2));

    return {
      userId: user.id,
      staffName: user.name,
      email: user.email,
      totalLeads,
      activeLeads: filteredLeads.filter(
        (lead) =>
          !["FINALIZED", "CONVERTED", "REJECTED", "ON_HOLD"].includes(
            lead.status,
          ),
      ).length,
      finalized,
      converted,
      rejected,
      onHold,
      successRate: Math.round(successRate * 100) / 100,
      totalRevenue,
      totalDiscount,
      averageRevenuePerLead: totalLeads > 0 ? totalRevenue / totalLeads : 0,
      conversionRate,
      totalCommission,
    };
  });
};
