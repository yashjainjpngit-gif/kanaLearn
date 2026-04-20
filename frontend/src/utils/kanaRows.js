export function getKanaRowMeta(item) {
  if (!item) {
    return {
      label: "",
      order: 999,
    };
  }

  if (item.romaji === "n") {
    return {
      label: "N-only",
      order: (item.row_order ?? 999) + 0.1,
    };
  }

  return {
    label: item.row_label ?? "",
    order: item.row_order ?? 999,
  };
}
