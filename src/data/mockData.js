// Entirely fictional Indian-context demo data. Shape is shared by every case.
const names = [
  ['Aarav Mehta', 'Kavya Nair', 'Rohan Kulkarni', 'Ishita Rao', 'Dev Malhotra'],
  ['Neha Bansal', 'Arjun Sethi', 'Meera Iyer', 'Kabir Joshi', 'Tara Kapoor'],
  ['Vikram Desai', 'Ananya Pillai', 'Siddharth Bose', 'Riya Chawla', 'Manav Goel'],
  ['Pooja Menon', 'Aditya Vora', 'Sana Qureshi', 'Kunal Bhatia', 'Nikhil Arora'],
  ['Ira Mukherjee', 'Yash Reddy', 'Simran Kaur', 'Harish Namboodiri', 'Diya Shah']
]
const aliases = ['Cipher', 'Ledger', 'Kite', 'Pulse', 'Anchor']
const locationKinds = ['incident', 'evidence_drop', 'sighting', 'incident', 'sighting', 'evidence_drop']

function makeCase({ id, title, status, investigator, summary, center, places, date }) {
  const people = names[Math.max(0, Number(date.slice(-2)) - 3)] || names[0]
  const suspects = people.map((name, index) => ({
    id: `S${index + 1}`, name, alias: aliases[index], age: 25 + index * 5,
    threatLevel: ['Critical', 'High', 'Medium', 'High', 'Low'][index],
    status: status === 'Closed' ? 'In Custody' : ['At Large', 'Person of Interest', 'In Custody', 'At Large', 'Person of Interest'][index],
    lastKnownLocation: places[index % places.length].name, linkedEvidenceCount: index < 4 ? 2 : 1,
    notes: `Fictional demo profile linked to the ${title} investigation.`,
    involvementSummary: `Linked to this fictional case through ${index < 4 ? 'two recorded evidence items and a documented network relationship' : 'a documented location sighting and a supporting network relationship'}.`
  }))
  const locations = places.map((place, index) => ({
    id: `L${index + 1}`, name: place.name, type: locationKinds[index], address: place.address,
    lat: place.lat, lng: place.lng, datetime: `${date}-${String(4 + index * 2).padStart(2, '0')} ${String(9 + index).padStart(2, '0')}:15`,
    description: `Fictional operational location recorded for the ${title} case.`
  }))
  const evidence = ['Encrypted device image', 'CCTV sequence', 'Financial ledger copy', 'Trace material sample', 'Access-card logs', 'Witness statement', 'Transport manifest'].map((titleText, index) => ({
    id: `E${index + 1}`, title: `${titleText} — ${places[index % places.length].name}`, type: ['Digital', 'Digital', 'Document', 'Physical', 'Digital', 'Document', 'Physical'][index],
    confidence: [94, 86, 78, 89, 82, 74, 91][index], linkedSuspectId: `S${(index % 5) + 1}`,
    linkedLocationId: `L${(index % 6) + 1}`, chainOfCustody: ['Secured', 'Secured', 'Lab', 'Lab', 'Secured', 'Sealed', 'Secured'][index],
    tags: [['Forensics'], ['Visual ID'], ['Financial'], ['Lab'], ['Access'], ['Interview'], ['Logistics']][index]
  }))
  const relationships = [
    ['S1','L1','Linked To'], ['S1','E1','Owner Of'], ['S1','S2','Known Associate'],
    ['S2','L2','Spotted Near'], ['S2','E2','Captured On'], ['S2','E3','Linked To'],
    ['S3','L3','Interviewed Near'], ['S3','E4','Trace Match'], ['S3','S4','Alibi Contradicts'],
    ['S4','L4','Accessed'], ['S4','E5','Credential Match'], ['S4','E6','Named In'],
    ['S5','L5','Spotted Near'], ['S5','E7','Transport Link'], ['S5','L6','Visited']
  ].map(([source, target, label]) => ({ source, target, label }))
  const timeline = locations.map((location, index) => ({ id: `T${index + 1}`, date: location.datetime.slice(0, 10), type: index === 0 ? 'Case Opened' : index % 2 ? 'Incident' : 'Forensics Received', description: `${location.name} logged in this fictional case timeline.` }))
  return { id, title, status, firNumber: `FIR-${date.slice(0, 4)}-${['MH', 'DL', 'KA', 'KL', 'RJ'][Math.max(0, Number(date.slice(-2)) - 3)] || 'IN'}-${id.slice(-3)}`, leadInvestigator: investigator, createdAt: `${date}-01`, summary, story: [`The fictional ${title} inquiry began after connected activity was recorded across ${places[0].name} and ${places[1].name}. Initial review identified a pattern of coordinated movement, supporting records, and digital traces.`, `Investigators mapped the five-person network against documented locations and recovered items. The case file remains a demonstration-only narrative; every person, event, and detail is fictional.`], mapCenter: center, mapZoom: 12, suspects, locations, evidence, relationships, timeline,
    milestones: ['Case Opened','Evidence Collection','Warrant Issued','Suspect Interrogated','Network Mapped','Case Closed'].map((label, index) => ({ id: `M${index + 1}`, label, complete: status === 'Closed' || index < 3 })) }
}

const CASES_BUILDING = {}
Object.assign(CASES_BUILDING, {
  'CASE-2026-889A': makeCase({ id: 'CASE-2026-889A', title: 'Operation Shadow-Grid', status: 'Active', investigator: 'Insp. Anjali Verma', summary: 'Fictional financial-fraud network across Mumbai.', center: [19.076, 72.8777], date: '2026-03', places: [
    { name: 'Fort Exchange Annex', address: 'Fort, Mumbai', lat: 18.934, lng: 72.835 }, { name: 'Bandra Reclamation Pier', address: 'Bandra West, Mumbai', lat: 19.061, lng: 72.823 }, { name: 'Lower Parel Ledger Office', address: 'Lower Parel, Mumbai', lat: 18.998, lng: 72.827 }, { name: 'Andheri Transit Flat', address: 'Andheri East, Mumbai', lat: 19.119, lng: 72.869 }, { name: 'Navi Mumbai Cargo Gate', address: 'Vashi, Navi Mumbai', lat: 19.077, lng: 72.998 }, { name: 'Powai Data Hub', address: 'Powai, Mumbai', lat: 19.117, lng: 72.906 }
  ] }),
  'CASE-2026-104B': makeCase({ id: 'CASE-2026-104B', title: 'Connaught Vault Breach', status: 'Closed', investigator: 'Insp. Rakesh Singh', summary: 'Fictional after-hours vault breach in New Delhi.', center: [28.6139, 77.209], date: '2026-01', places: [
    { name: 'Connaught Place Vault', address: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 }, { name: 'Karol Bagh Vehicle Bay', address: 'Karol Bagh, New Delhi', lat: 28.6519, lng: 77.1909 }, { name: 'Chandni Chowk Exchange', address: 'Chandni Chowk, Delhi', lat: 28.6506, lng: 77.2303 }, { name: 'Saket Rental Flat', address: 'Saket, New Delhi', lat: 28.5245, lng: 77.2066 }, { name: 'Okhla Storage Yard', address: 'Okhla, New Delhi', lat: 28.5355, lng: 77.275 }, { name: 'IGI Terminal Deck', address: 'Mahipalpur, Delhi', lat: 28.5562, lng: 77.1 }
  ] }),
  'CASE-2026-217C': makeCase({ id: 'CASE-2026-217C', title: 'Silicon Signal', status: 'Active', investigator: 'Insp. Lakshmi Krishnan', summary: 'Fictional data-theft inquiry in Bengaluru.', center: [12.9716, 77.5946], date: '2026-04', places: [
    { name: 'MG Road Relay', address: 'MG Road, Bengaluru', lat: 12.975, lng: 77.606 }, { name: 'Whitefield Server Block', address: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.7499 }, { name: 'Indiranagar Cafe', address: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 }, { name: 'Koramangala Workshop', address: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 }, { name: 'Yeshwanthpur Freight Yard', address: 'Yeshwanthpur, Bengaluru', lat: 13.024, lng: 77.55 }, { name: 'Electronic City Gate', address: 'Electronic City, Bengaluru', lat: 12.8456, lng: 77.6603 }
  ] }),
  'CASE-2026-332D': makeCase({ id: 'CASE-2026-332D', title: 'Monsoon Manifest', status: 'Active', investigator: 'Insp. Farhan Ali', summary: 'Fictional logistics-manifest inquiry in Kochi.', center: [9.9312, 76.2673], date: '2026-05', places: [
    { name: 'Willingdon Island Dock', address: 'Willingdon Island, Kochi', lat: 9.947, lng: 76.259 }, { name: 'Fort Kochi Archive', address: 'Fort Kochi, Kochi', lat: 9.965, lng: 76.242 }, { name: 'Kaloor Transit Point', address: 'Kaloor, Kochi', lat: 9.995, lng: 76.288 }, { name: 'Vyttila Warehouse', address: 'Vyttila, Kochi', lat: 9.967, lng: 76.318 }, { name: 'Ernakulam Junction', address: 'Ernakulam, Kochi', lat: 9.9816, lng: 76.2999 }, { name: 'Mattancherry Store', address: 'Mattancherry, Kochi', lat: 9.958, lng: 76.259 }
  ] }),
  'CASE-2026-458E': makeCase({ id: 'CASE-2026-458E', title: 'Pink City Cipher', status: 'Active', investigator: 'Insp. Shalini Rathore', summary: 'Fictional encrypted-payment investigation in Jaipur.', center: [26.9124, 75.7873], date: '2026-06', places: [
    { name: 'MI Road Exchange', address: 'MI Road, Jaipur', lat: 26.9196, lng: 75.7947 }, { name: 'Bapu Bazaar Counter', address: 'Bapu Bazaar, Jaipur', lat: 26.918, lng: 75.824 }, { name: 'Malviya Nagar Hub', address: 'Malviya Nagar, Jaipur', lat: 26.855, lng: 75.805 }, { name: 'Vaishali Nagar Flat', address: 'Vaishali Nagar, Jaipur', lat: 26.916, lng: 75.744 }, { name: 'Sanganer Cargo Lane', address: 'Sanganer, Jaipur', lat: 26.816, lng: 75.789 }, { name: 'Amer Road Lookout', address: 'Amer Road, Jaipur', lat: 26.951, lng: 75.854 }
  ] })
})

export const CASES = CASES_BUILDING
export const CASE_LIST = Object.values(CASES).map(({ id, title, status }) => ({ id, title, status }))
export const AGENT_ROSTER = ['RA RI DELTA', 'PR RI DELTA', 'AN RI DELTA', 'VI RI DELTA', 'KA RI DELTA']
export const THREAT_COLORS = { Critical: '#ff5470', High: '#f5a623', Medium: '#3fd0ff', Low: '#2fe6a7' }
export const LOCATION_TYPE_META = { incident: { color: '#f5a623', label: 'Incident' }, evidence_drop: { color: '#b98bff', label: 'Evidence Drop' }, sighting: { color: '#ff5470', label: 'Suspect Sighting' } }
export const EVIDENCE_TYPE_META = { Digital: { color: '#3fd0ff', label: 'Digital' }, Physical: { color: '#b98bff', label: 'Physical' }, Document: { color: '#2fe6a7', label: 'Document' } }
