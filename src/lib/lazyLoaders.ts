let _XLSX: any = null
export const loadXLSX = async () => {
  if (!_XLSX) _XLSX = await import('xlsx')
  return _XLSX
}

let _jsPDF: any = null
export const loadJsPDF = async () => {
  if (!_jsPDF) _jsPDF = await import('jspdf')
  return _jsPDF.default
}

let _autoTable: any = null
export const loadAutoTable = async () => {
  if (!_autoTable) _autoTable = await import('jspdf-autotable')
  return _autoTable.default
}
