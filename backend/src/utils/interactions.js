export const buildInteractionWarnings = (medicines, interactionRows) => {
  if (!interactionRows.length) return [];

  const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
  const seenPairs = new Set();

  return interactionRows.reduce((warnings, row) => {
    const ids = [row.medicine_id, row.interacts_with_id].sort((a, b) => a - b);
    const key = ids.join('-');

    if (seenPairs.has(key)) {
      return warnings;
    }

    const medA = medicineMap.get(row.medicine_id);
    const medB = medicineMap.get(row.interacts_with_id);

    if (!medA || !medB) {
      return warnings;
    }

    warnings.push({
      severity: row.severity,
      description: row.description,
      medicines: [
        { id: medA.id, name: medA.name },
        { id: medB.id, name: medB.name }
      ]
    });

    seenPairs.add(key);
    return warnings;
  }, []);
};

