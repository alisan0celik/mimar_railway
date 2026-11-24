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
    support: {
      guide: {
        sections: {
          progress: {
            steps:
              "Proje detayının üstündeki İmalat ve Hakediş bağlantısına girin.|Sözleşmeyi imalat kalemlerine bölün ve her kaleme sözleşmedeki bedelini yazın.|Sık kullandığınız kalemleri yıldızlayın; sonraki projeleriniz o kalemlerle açılır.|Hakediş Ödeme'ye basın; tutar alanı kalemin kalan bedeliyle dolu gelir. Kısmi hakediş için tutarı değiştirip Öde'ye basın.|Her hakediş kalemin kalan bedelinden düşer; bir kaleme bedelinden fazla ödeme yapılamaz.|İş artışı, fiyat farkı gibi kalemlere bağlı olmayan tutarları İş Artışı ve Diğer Kalemler bölümüne ekleyin; sözleşme toplamına girer.|Ödenen hakediş finansa yükleniciye ödeme olarak kendiliğinden işlenir.|Bir kalemi silerseniz o kalemden kesilmiş hakedişler ve bunların finans kayıtları da silinir.|Bu ekranı yalnızca finans yetkisi olanlar görür.",
          },
          finance: {
            steps:
              "Finans sekmesinden proje bazlı özetleri inceleyin: sözleşme bedeli, ödenen ve kalan ödeme.|İmalat ve Hakediş ekranında bir kaleme bedel girdiğinizde proje finansa kendiliğinden eklenir; Finans Oluştur gerekmez.|Yetkiniz varsa yükleniciye ödeme ve diğer gider kaydı ekleyin.|Proje detayından işlem geçmişine ulaşın.",
          },
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
      tours: {
        projects: {
          card: {
            body: "Her kart bir iş. Açtığınızda notları, yapılacakları, ihale bilgilerini, saha raporlarını ve yetkiniz varsa hakedişi orada bulursunuz.",
          },
        },
        projectDetail: {
          progress: {
            body: "Kalem bedellerini girin, hakedişi istediğiniz tutarda ödeyin; kalan bedel kendiliğinden takip edilir.",
          },
        },
        createProject: {
          workItems: {
            body: "Bir şablon seçin ya da kalemleri tek tek işaretleyin. Hakedişler bu kalemler üzerinden ödenir.",
          },
        },
        finance: {
          summary: {
            // Belediye modunda kâr gizli; tahsilat ve alacak ödeyen taraf için ters.
            body: "Sözleşme bedeli, ödenen ve kalan ödeme; bütün projelerinizin toplamı.",
          },
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
    support: {
      guide: {
        sections: {
          progress: {
            steps:
              "Open the Work Items and Billing link at the top of the project detail.|Split the contract into work items and give each one its contract value.|Star the ones you use often; later projects open with them.|Tap Record Payment; the amount comes filled with what is left of the item. Change it for a partial bill, then tap Pay.|Each payment comes off what is left of the item; an item can't be paid beyond its value.|Put variations and price escalation under Variations and Other Items; they count towards the contract total.|Paid progress payments are recorded in finance as payments to the contractor.|Deleting an item also deletes the progress payments billed from it and their finance entries.|Only people with finance rights can see this screen.",
          },
          finance: {
            steps:
              "Review project summaries in the Finance tab: contract value, paid and left to pay.|A project appears in Finance on its own once you give one of its items a value under Work Items and Billing; no need to Create Finance.|Record payments to the contractor and other expenses if permitted.|Open transaction history from project detail.",
          },
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
      tours: {
        projects: {
          card: {
            body: "Each card is one job. Open it for notes, to-dos, tender details, site reports, and progress payments if you have access.",
          },
        },
        projectDetail: {
          progress: {
            body: "Enter each item's value and pay progress payments in any amount; what is left is tracked for you.",
          },
        },
        createProject: {
          workItems: {
            body: "Pick a template or tick the items one by one. Progress payments are paid against these items.",
          },
        },
        finance: {
          summary: {
            body: "Contract value, paid and left to pay, across all your projects.",
          },
        },
      },
    },
  },
};
