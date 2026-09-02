const STORAGE_KEY = 'dr-rocha-leads'

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function loadLeads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLead(lead) {
  const leads = loadLeads()
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...lead,
    nameKey: normalizeName(lead.name),
    phoneKey: normalizePhone(lead.phone),
  }
  leads.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  return entry
}

export function removeLeadsByIdentity(name, phone) {
  const nameKey = normalizeName(name)
  const phoneKey = normalizePhone(phone)
  if (!nameKey || !phoneKey) {
    return { removed: 0, remaining: loadLeads() }
  }
  const leads = loadLeads()
  const remaining = leads.filter((l) => !(l.nameKey === nameKey && l.phoneKey === phoneKey))
  const removed = leads.length - remaining.length
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  return { removed, remaining }
}
