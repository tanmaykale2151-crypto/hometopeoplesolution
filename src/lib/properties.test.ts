import { describe, expect, it } from "vitest";
import { isPubliclyVisible, normalizeIndianPhone, telLink, whatsappLink } from "./properties";

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

describe("listing verification", () => {
  it("shows a listing to other users only after it is approved", () => {
    expect(isPubliclyVisible({ status: "pending", is_available: true })).toBe(false);
    expect(isPubliclyVisible({ status: "rejected", is_available: true })).toBe(false);
    expect(isPubliclyVisible({ status: "approved", is_available: true })).toBe(true);
  });

  it("hides an approved listing once the owner marks it rented", () => {
    expect(isPubliclyVisible({ status: "approved", is_available: false })).toBe(false);
  });
});
