const NEPALI_LOCAL_PHONE_PATTERN = /^9\d{9}$/;
const NEPALI_E164_PHONE_PATTERN = /^\+9779\d{9}$/;

export const isNepaliPhoneE164 = (phone: string) =>
  NEPALI_E164_PHONE_PATTERN.test(phone);

export const normalizeNepaliPhone = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const digitsOnly = trimmed.replace(/\D/g, "");
  let local = digitsOnly;

  if (trimmed.startsWith("+977")) {
    local = digitsOnly.slice(3);
  } else if (digitsOnly.startsWith("977")) {
    local = digitsOnly.slice(3);
  }

  if (local.startsWith("0") && local.length === 11) {
    local = local.slice(1);
  }

  if (!NEPALI_LOCAL_PHONE_PATTERN.test(local)) {
    return null;
  }

  return `+977${local}`;
};

export const getNepaliLocalPhone = (phone: string) => {
  if (!isNepaliPhoneE164(phone)) return "";
  return phone.slice(4);
};
