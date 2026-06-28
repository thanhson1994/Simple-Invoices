import * as Yup from "yup";

export const invoiceValidationSchema = Yup.object().shape({
  // Invoice details
  invoiceNumber: Yup.string()
    .trim()
    .required("Invoice number is required")
    .min(3, "Invoice number must be at least 3 characters"),

  invoiceReference: Yup.string().trim(),

  currency: Yup.string()
    .required("Currency is required")
    .length(3, "Currency must be a 3-letter code (e.g., GBP, USD)"),

  invoiceDate: Yup.date()
    .required("Invoice date is required")
    .typeError("Invalid date format"),

  dueDate: Yup.date()
    .required("Due date is required")
    .typeError("Invalid date format")
    .min(Yup.ref("invoiceDate"), "Due date must be on or after invoice date"),

  description: Yup.string().trim(),

  // Customer information
  customer: Yup.object().shape({
    firstName: Yup.string()
      .trim()
      .required("First name is required")
      .min(2, "First name must be at least 2 characters"),

    lastName: Yup.string()
      .trim()
      .required("Last name is required")
      .min(2, "Last name must be at least 2 characters"),

    contact: Yup.object().shape({
      email: Yup.string()
        .trim()
        .required("Email is required")
        .email("Invalid email format"),

      mobileNumber: Yup.string().trim(),
    }),

    addresses: Yup.array()
      .of(
        Yup.object().shape({
          premise: Yup.string().trim().required("Premise/building is required"),

          city: Yup.string().trim().required("City is required"),

          postcode: Yup.string().trim().required("Postcode is required"),

          countryCode: Yup.string()
            .required("Country code is required")
            .length(2, "Country code must be 2 letters (e.g., GB, US)"),

          county: Yup.string().trim(),

          addressType: Yup.string()
            .required("Address type is required")
            .oneOf(
              ["BILLING", "SHIPPING"],
              "Address type must be BILLING or SHIPPING",
            ),
        }),
      )
      .min(1, "At least one address is required"),
  }),

  // Bank account (optional)
  bankAccount: Yup.object()
    .shape({
      accountName: Yup.string().trim(),
      accountNumber: Yup.string().trim(),
      sortCode: Yup.string().trim(),
      bankId: Yup.string().trim(),
    })
    .notRequired(),

  // Line item (single item only)
  items: Yup.array()
    .of(
      Yup.object().shape({
        itemName: Yup.string()
          .trim()
          .required("Item name is required")
          .min(2, "Item name must be at least 2 characters"),

        description: Yup.string()
          .trim()
          .required("Item description is required"),

        quantity: Yup.number()
          .required("Quantity is required")
          .positive("Quantity must be greater than 0")
          .integer("Quantity must be a whole number"),

        rate: Yup.number()
          .required("Rate is required")
          .min(0, "Rate must be 0 or greater"),

        itemReference: Yup.string().trim(),
        itemUOM: Yup.string().trim(),
      }),
    )
    .min(1, "At least one item is required")
    .max(1, "Only one item is allowed"),

  // Optional fields
  documents: Yup.array().of(
    Yup.object().shape({
      documentId: Yup.string().required(),
      documentName: Yup.string().required(),
      documentUrl: Yup.string().url("Invalid URL format").required(),
    }),
  ),

  customFields: Yup.array().of(
    Yup.object().shape({
      key: Yup.string().required(),
      value: Yup.string().required(),
    }),
  ),

  extensions: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required(),
      type: Yup.string().oneOf(["PERCENTAGE", "FIXED_VALUE"]).required(),
      addDeduct: Yup.string().oneOf(["ADD", "DEDUCT"]).required(),
      value: Yup.number().min(0).required(),
    }),
  ),
});
