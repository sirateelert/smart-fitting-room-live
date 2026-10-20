import { createContext, useContext } from "react";
import { STATUS as S, TYPE } from "./status.js";

// Lightweight Thai / English dictionary. Covers navigation, statuses, action buttons and metrics.
// Anything missing in Thai falls back to English, then to the key itself.
export const LANGS = ["en", "th"];

const DICT = {
  en: {
    "nav.tutorial": "▶ Tutorial", "nav.rooms": "Fitting rooms ({n})", "nav.demo": "Demo controls", "nav.reset": "Reset demo",
    "nav.lang": "Switch language",
    "title.customer": "Customer Tablet", "title.staff": "Staff View",

    "status.pending": "Pending", "status.accepted": "Claimed by Runner", "status.delivering": "Out for delivery",
    "status.delivered": "Delivered", "status.oos": "Out of stock", "status.cancelled": "Cancelled", "status.closed": "Closed",
    "status.resolved": "Resolved", "status.ready": "Staged", "status.entered": "Arrived", "status.ack": "Acknowledged",
    "cust.pending": "Received", "cust.accepted": "Preparing", "cust.delivering": "On the way", "cust.delivered": "Delivered",

    "act.requestOne": "Request new size", "act.requestMany": "Request {n} items", "act.reserve": "Reserve garments",
    "act.assist": "Call for assistance", "act.cancel": "Cancel request", "act.another": "Request another item",
    "act.claim": "Claim Order", "act.deliver": "Out for delivery", "act.delivered": "Mark as Delivered",
    "act.flag": "Flag out of stock", "act.ack": "Acknowledge", "act.resolve": "Mark resolved",
    "act.staged": "Items staged in {room}", "act.arrived": "Customer arrived", "act.dismiss": "Dismiss",

    "staff.inQueue": "In queue", "staff.pending": "Pending", "staff.claimed": "Claimed", "staff.breached": "SLA breached",
    "staff.queue": "Queue", "staff.recent": "Recent", "staff.runners": "Runners", "staff.active": "{a} active · {p} pending",
    "staff.assigned": "Assigned to {name}",

    "m.title": "Business metrics", "m.avg": "Avg fulfilment wait", "m.breach": "SLA breach rate (> 4 min)",
    "m.latency": "Peak vs normal latency", "m.peak": "Peak", "m.normal": "Normal", "m.none": "No data yet",
    "m.delivered": "{n} delivered",

    "demo.title": "Demo Controls", "demo.visitors": "Scripted visitors", "demo.visitor": "Run Visitor {n}",
    "demo.visitorHint": "Resets to a clean baseline, then plays a fixed sequence.",
  },
  th: {
    "nav.tutorial": "▶ บทแนะนำ", "nav.rooms": "ห้องลองเสื้อ ({n})", "nav.demo": "ตัวควบคุมเดโม", "nav.reset": "รีเซ็ตเดโม",
    "nav.lang": "เปลี่ยนภาษา",
    "title.customer": "แท็บเล็ตลูกค้า", "title.staff": "มุมมองพนักงาน",

    "status.pending": "รอดำเนินการ", "status.accepted": "พนักงานรับออเดอร์แล้ว", "status.delivering": "กำลังนำส่ง",
    "status.delivered": "ส่งแล้ว", "status.oos": "สินค้าหมด", "status.cancelled": "ยกเลิกแล้ว", "status.closed": "ปิดรายการแล้ว",
    "status.resolved": "แก้ไขแล้ว", "status.ready": "จัดเตรียมแล้ว", "status.entered": "ถึงห้องแล้ว", "status.ack": "รับทราบแล้ว",
    "cust.pending": "รับคำขอแล้ว", "cust.accepted": "กำลังเตรียม", "cust.delivering": "กำลังนำส่ง", "cust.delivered": "ส่งแล้ว",

    "act.requestOne": "ขอไซส์ใหม่", "act.requestMany": "ขอ {n} รายการ", "act.reserve": "จองสินค้า",
    "act.assist": "เรียกพนักงาน", "act.cancel": "ยกเลิกคำขอ", "act.another": "ขอสินค้าเพิ่ม",
    "act.claim": "รับออเดอร์", "act.deliver": "กำลังนำส่ง", "act.delivered": "ส่งเรียบร้อย",
    "act.flag": "แจ้งสินค้าหมด", "act.ack": "รับทราบ", "act.resolve": "แก้ไขเรียบร้อย",
    "act.staged": "จัดของเข้า {room} แล้ว", "act.arrived": "ลูกค้ามาถึงแล้ว", "act.dismiss": "ปิดรายการ",

    "staff.inQueue": "ในคิว", "staff.pending": "รอ", "staff.claimed": "รับแล้ว", "staff.breached": "เกิน SLA",
    "staff.queue": "คิว", "staff.recent": "ล่าสุด", "staff.runners": "ผู้จัดส่ง", "staff.active": "{a} กำลังดำเนินการ · {p} รอ",
    "staff.assigned": "มอบหมายให้ {name}",

    "m.title": "ตัวชี้วัดธุรกิจ", "m.avg": "เวลารอเฉลี่ยจนส่งของ", "m.breach": "อัตราเกิน SLA (> 4 นาที)",
    "m.latency": "ความหน่วง ช่วงเร่งด่วน เทียบกับปกติ", "m.peak": "เร่งด่วน", "m.normal": "ปกติ", "m.none": "ยังไม่มีข้อมูล",
    "m.delivered": "ส่งแล้ว {n} รายการ",

    "demo.title": "ตัวควบคุมเดโม", "demo.visitors": "ผู้เยี่ยมชมตามสคริปต์", "demo.visitor": "เริ่มผู้เยี่ยมชม {n}",
    "demo.visitorHint": "รีเซ็ตเป็นค่าเริ่มต้น แล้วเล่นลำดับที่กำหนดไว้",
  },
};

export const makeT = (lang) => (key, vars) => {
  const raw = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`)) : raw;
};

export const LangContext = createContext({ lang: "en", t: makeT("en"), setLang: () => {} });
export const useT = () => useContext(LangContext);

// Status text for a request, mirroring statusText() in status.js but translated
export const statusLabel = (t, r) =>
  r.type === TYPE.ASSIST && r.status === S.CLAIMED ? t("status.ack")
  : r.status === S.CLAIMED && r.runner ? `${t("status.accepted")} · ${r.runner}`
  : t(`status.${r.status}`);
