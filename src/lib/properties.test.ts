import { describe, expect, it } from "vitest";
import { normalizeIndianPhone, telLink, whatsappLink } from "./properties";

describe("owner contact", () => {
  it("accepts a 10-digit Indian mobile number with or without +91", () => {
    expect(normalizeIndianPhone("98220 12345")).toBe("9822012345");
    expect(normalizeIndianPhone("+91-9822012345")).toBe("9822012345");
    expect(normalizeIndianPhone("09822012345")).toBe("9822012345");
  });

  it("rejects numbers that are not Indian mobiles", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("1234567890")).toBeNull();
  });

  it("builds call and WhatsApp links to the owner's number", () => {
    expect(telLink("9822012345")).toBe("tel:+919822012345");
    expect(whatsappLink("+91 98220 12345", "Hi")).toBe("https://wa.me/919822012345?text=Hi");
  });
});
