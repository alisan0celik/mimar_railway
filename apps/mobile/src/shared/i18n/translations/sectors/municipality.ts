import type { Language, TranslationTree } from "../../types";

/**
 * Belediye modunda ana çevirilerin üstüne yazılan metinler.
 *
 * Belediye, yükleniciye hakediş ödeyen işverendir. Ana metinler ise parayı
 * alan taraftan (ofis, müteahhit) yazılmış: "Tahsil edilen", "Kalan alacak",
 * "Müşteri". Burada yalnızca bakışın değiştiği anahtarlar var; geri kalan her
 * şey ana çeviriden gelir. Buraya eklenen her anahtar ana çeviride de
 * bulunmalı, yoksa üstüne yazma hiç görünmez.
 */
export const municipality: Record<Language, TranslationTree> = {
  tr: {
    dashboard: {
      totalCollected: "Toplam Ödenen",
      remainingReceivable: "Kalan Ödeme",
    },
    projects: {
      searchPlaceholder: "Proje veya yüklenici ara...",
      customerName: "Yüklenici",
      createForm: {
        summaryCustomer: "Yüklenici",
        customerPlaceholder: "Örn. Yıldız İnşaat A.Ş.",
      },
      teamMember: {
        selectEmployee: "Personel Seç",
        noAvailable: "Eklenebilecek personel yok",
        loadFailed: "Personel listesi yüklenemedi",
      },
    },
    finance: {
      searchPlaceholder: "Proje veya yüklenici ara...",
      totalAgreement: "Toplam Sözleşme Bedeli",
      moneyReceived: "Ödenen",
      remainingReceivable: "Kalan Ödeme",
      received: "Ödenen",
      overpaymentNotice: "Fazla ödeme: {amount}",
      detail: {
        agreedAmount: "Sözleşme bedeli",
        receivedAmount: "Ödenen",
        remainingAmount: "Kalan ödeme",
      },
      edit: {
        subtitle: "Proje ve sözleşme bedeli bilgisi",
        agreedAmountLabel: "Sözleşme Bedeli (₺)",
        lockedBody:
          "Bu projenin sözleşme bedeli, imalat kalemlerinin bedelleri toplanarak hesaplanıyor. Değiştirmek için kalem bedellerini İmalat ve Hakediş ekranından düzenleyin.",
      },
      addPaymentForm: {
        customer: "Yüklenici",
        received: "Yükleniciye Ödeme",
        sent: "Diğer Gider",
      },
      success: {
        collectionAdded: "Ödeme başarıyla kaydedildi.",
        agreementCreated: "Projenin sözleşme bedeli kaydedildi.",
      },
      transactionTypes: {
        collection: "Ödeme",
      },
    },
    progress: {
      collected: "Ödenen",
      outstanding: "Ödeme Bekleyen",
      billedMeta: "Hakediş {billed} · Kalan {remaining}",
      extras: "İş Artışı ve Diğer Kalemler",
      extrasHint:
        "İş artışı, fiyat farkı gibi imalat kalemlerine bağlı olmayan tutarlar. Sözleşme toplamına eklenir.",
      extraReceivable: "Ödenecek",
      payTooMuch:
        "Tutar, kalemin kalan bedelini ({amount}) aşamaz. Fazlası için İş Artışı ve Diğer Kalemler bölümüne iş artışı ekleyin.",
    },
    users: {
      approveRole: {
        officeManager: "Birim Yöneticisi",
        officeEmployee: "Birim Personeli",
      },
    },
    roles: {
      builtIn: {
        officeManager: "Birim Yöneticisi",
        officeEmployee: "Birim Personeli",
      },
    },
    profile: {
      companyLogo: "Kurum Logosu",
    },
    companies: {
      logo: {
        title: "Kurum Logosu",
        hint: "Logonuz uygulama içinde görünür.",
        updated: "Kurum logosu güncellendi.",
        noPermission: "Kurum logosunu yalnızca birim yöneticileri değiştirebilir.",
        removeConfirm: "Kurum logosu kaldırılacak ve yerine baş harfler gösterilecek.",
        removed: "Kurum logosu kaldırıldı.",
      },
    },
    permissions: {
      user: {
        remove: {
          label: "Birimden Çıkarma",
          description: "Onaylı üyeleri birimden çıkarabilir",
        },
      },
    },
    guide: {
      welcome: {
        ownerBody:
          "Biriminiz projeler ve hakedişler üzerinden yürür. Kurulum listesindeki adımları istediğiniz sırayla tamamlayabilirsiniz.",
        memberTitle: "{companyName} ekibine hoş geldiniz!",
        defaultCompany: "Kurum",
      },
      checklist: {
        subtitle: "Biriminizi hazırlamak için birkaç kısa adım kaldı.",
        items: {
          logo: "Kurum logonuzu yükleyin",
        },
      },
    },
  },
  en: {
    dashboard: {
      totalCollected: "Total Paid",
      remainingReceivable: "Left to Pay",
    },
    projects: {
      searchPlaceholder: "Search project or contractor...",
      customerName: "Contractor",
      createForm: {
        summaryCustomer: "Contractor",
        customerPlaceholder: "e.g. Star Construction Inc.",
      },
      teamMember: {
        selectEmployee: "Select Staff",
        noAvailable: "No staff available to add",
        loadFailed: "Could not load staff",
      },
    },
    finance: {
      searchPlaceholder: "Search project or contractor...",
      totalAgreement: "Total Contract Value",
      moneyReceived: "Paid",
      remainingReceivable: "Left to Pay",
      received: "Paid",
      overpaymentNotice: "Overpaid: {amount}",
      detail: {
        agreedAmount: "Contract value",
        receivedAmount: "Paid",
        remainingAmount: "Left to pay",
      },
      edit: {
        subtitle: "Project and contract value details",
        agreedAmountLabel: "Contract Value (₺)",
        lockedBody:
          "The contract value for this project is the sum of its work item values. To change it, edit those values on the Work Items and Progress Payments screen.",
      },
      addPaymentForm: {
        customer: "Contractor",
        received: "Payment to Contractor",
        sent: "Other Expense",
      },
      success: {
        collectionAdded: "Payment recorded successfully.",
        agreementCreated: "The project's contract value was saved.",
      },
      transactionTypes: {
        collection: "Payment",
      },
    },
    progress: {
      collected: "Paid",
      outstanding: "Awaiting Payment",
      billedMeta: "Billed {billed} · Left {remaining}",
      extras: "Variations and Other Items",
      extrasHint:
        "Amounts outside the work items, such as variations and price escalation. They are added to the contract total.",
      extraReceivable: "To pay",
      payTooMuch:
        "The amount can't exceed what's left of the item ({amount}). Add anything beyond it as a variation under Variations and Other Items.",
    },
    users: {
      approveRole: {
        officeManager: "Department Manager",
        officeEmployee: "Department Staff",
      },
    },
    roles: {
      builtIn: {
        officeManager: "Department Manager",
        officeEmployee: "Department Staff",
      },
    },
    profile: {
      companyLogo: "Institution Logo",
    },
    companies: {
      logo: {
        title: "Institution Logo",
        hint: "Your logo appears across the app.",
        updated: "Institution logo updated.",
        noPermission: "Only department managers can change the institution logo.",
        removeConfirm: "The institution logo will be removed and initials shown instead.",
        removed: "Institution logo removed.",
      },
    },
    permissions: {
      user: {
        remove: {
          label: "Remove from Department",
          description: "Can remove approved members from the department",
        },
      },
    },
    guide: {
      welcome: {
        ownerBody:
          "Your department runs on projects and progress payments. You can finish the setup list in any order.",
        memberTitle: "Welcome to the {companyName} team!",
        defaultCompany: "Institution",
      },
      checklist: {
        subtitle: "A few short steps left to get your department ready.",
        items: {
          logo: "Upload your institution logo",
        },
      },
    },
  },
};
