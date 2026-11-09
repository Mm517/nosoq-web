/* js/i18n-dict.js — قاموس الترجمة المركزي (ar / en / de). يُحمَّل قبل js/i18n.js.
   keys    : مفاتيح t('add_to_cart') → [عربي, English, Deutsch]
   phrases : النص العربي الأصلي (الأرقام تُكتب {n}) → [English, Deutsch] — يُطبَّق على كل نص يظهر في الصفحة.
   لإضافة نص جديد: أضف سطراً في phrases (أو مفتاحاً في keys) ثم استخدم t('المفتاح') أو اتركه نصاً عربياً عادياً. */
window.NASAQ_I18N_DICT = {
"keys": {
"home": [
"الصفحة الرئيسية",
"Home",
"Startseite"
],
"home_short": [
"الرئيسية",
"Home",
"Start"
],
"cart": [
"السلة",
"Cart",
"Warenkorb"
],
"shopping_cart": [
"سلة التسوق",
"Shopping Cart",
"Warenkorb"
],
"checkout": [
"إتمام الطلب",
"Checkout",
"Zur Kasse"
],
"add_to_cart": [
"إضافة للسلة",
"Add to Cart",
"In den Warenkorb"
],
"add_to_cart2": [
"أضف إلى السلة",
"Add to Cart",
"In den Warenkorb"
],
"product_description": [
"وصف المنتج",
"Product Description",
"Produktbeschreibung"
],
"login": [
"تسجيل الدخول",
"Log in",
"Anmelden"
],
"logout": [
"تسجيل الخروج",
"Log out",
"Abmelden"
],
"create_account": [
"إنشاء حساب جديد",
"Create a new account",
"Neues Konto erstellen"
],
"all_products": [
"كل المنتجات",
"All Products",
"Alle Produkte"
],
"search": [
"بحث",
"Search",
"Suchen"
],
"favorites": [
"المفضلة",
"Favorites",
"Favoriten"
],
"my_account": [
"حسابي",
"My Account",
"Mein Konto"
],
"language": [
"اللغة",
"Language",
"Sprache"
],
"save": [
"حفظ",
"Save",
"Speichern"
],
"cancel": [
"إلغاء",
"Cancel",
"Abbrechen"
],
"close": [
"إغلاق",
"Close",
"Schließen"
],
"confirm": [
"تأكيد",
"Confirm",
"Bestätigen"
],
"delete": [
"حذف",
"Remove",
"Entfernen"
],
"edit": [
"تعديل",
"Edit",
"Bearbeiten"
],
"orders": [
"الطلبات",
"Orders",
"Bestellungen"
],
"price": [
"السعر",
"Price",
"Preis"
],
"quantity": [
"الكمية",
"Quantity",
"Menge"
],
"total": [
"الإجمالي",
"Total",
"Gesamt"
],
"subtotal": [
"المجموع الفرعي",
"Subtotal",
"Zwischensumme"
],
"shipping": [
"الشحن",
"Shipping",
"Versand"
],
"free": [
"مجاني",
"Free",
"Kostenlos"
],
"category": [
"الفئة",
"Category",
"Kategorie"
],
"color": [
"اللون",
"Color",
"Farbe"
],
"size": [
"المقاس",
"Size",
"Größe"
],
"menu": [
"القائمة",
"Menu",
"Menü"
],
"cat_electronics": [
"إلكترونيات",
"Electronics",
"Elektronik"
],
"cat_appliances": [
"أجهزة منزلية",
"Home Appliances",
"Haushaltsgeräte"
],
"cat_home": [
"المنزل والمطبخ",
"Home & Kitchen",
"Haus & Küche"
],
"cat_clothes": [
"ملابس",
"Clothing",
"Kleidung"
],
"cat_shoes": [
"أحذية",
"Shoes",
"Schuhe"
],
"cat_bags": [
"حقائب",
"Bags",
"Taschen"
],
"cat_accessories": [
"إكسسوارات",
"Accessories",
"Accessoires"
],
"cat_beauty": [
"الجمال والعناية",
"Beauty & Care",
"Schönheit & Pflege"
],
"cat_supermarket": [
"سوبر ماركت",
"Supermarket",
"Supermarkt"
],
"cat_toys": [
"ألعاب وأطفال",
"Toys & Kids",
"Spielzeug & Kinder"
],
"cat_sports": [
"رياضة ولياقة",
"Sports & Fitness",
"Sport & Fitness"
],
"cat_books": [
"كتب وقرطاسية",
"Books & Stationery",
"Bücher & Schreibwaren"
],
"cat_auto": [
"السيارات",
"Automotive",
"Auto"
],
"cat_pets": [
"حيوانات أليفة",
"Pets",
"Haustiere"
],
"cat_tools": [
"عدد وأدوات",
"Tools",
"Werkzeug"
],
"wz_progress_label": [
"مراحل التسجيل",
"Registration steps",
"Registrierungsschritte"
],
"wz_step_of": [
"الخطوة {n} من {total}",
"Step {n} of {total}",
"Schritt {n} von {total}"
],
"wz_step_done": [
"مكتملة",
"completed",
"abgeschlossen"
],
"wz_next": [
"التالي",
"Next",
"Weiter"
],
"wz_prev": [
"السابق",
"Back",
"Zurück"
],
"wz_edit": [
"تعديل",
"Edit",
"Ändern"
],
"wz_submitting": [
"جارٍ الإرسال…",
"Submitting…",
"Wird gesendet…"
],
"wz_not_provided": [
"غير مُدخَل",
"Not provided",
"Nicht angegeben"
],
"wz_optional": [
"(اختياري)",
"(optional)",
"(optional)"
],
"wz_masked": [
"••••••••",
"••••••••",
"••••••••"
],
"wz_draft_restored": [
"استرجعنا بياناتك من حيث توقفت.",
"We restored your progress where you left off.",
"Wir haben Ihren Fortschritt an der letzten Stelle wiederhergestellt."
],
"wz_draft_restored_pw": [
"استرجعنا بياناتك. لأسباب أمنية لا نحفظ كلمة المرور، من فضلك أعد إدخالها.",
"We restored your details. For security we don't store your password, so please enter it again.",
"Wir haben Ihre Angaben wiederhergestellt. Aus Sicherheitsgründen speichern wir Ihr Passwort nicht – bitte geben Sie es erneut ein."
],
"wz_file_lost": [
"اختر الصورة مرة أخرى («{name}») — لا نحفظ الملفات في المسودة.",
"Please choose the image again (\"{name}\") – files are not kept in the draft.",
"Bitte wählen Sie das Bild erneut aus („{name}“) – Dateien werden im Entwurf nicht gespeichert."
],
"wz_logged_in_note": [
"أنت مسجَّل الدخول بالفعل، سنستخدم حسابك الحالي ولا تحتاج كلمة مرور جديدة.",
"You're already signed in. We'll use your current account, so no new password is needed.",
"Sie sind bereits angemeldet. Wir verwenden Ihr aktuelles Konto – ein neues Passwort ist nicht nötig."
],
"wz_err_required": [
"هذا الحقل مطلوب",
"This field is required",
"Dieses Feld ist erforderlich"
],
"wz_err_email": [
"أدخل بريداً إلكترونياً صحيحاً (مثال: name@example.com)",
"Enter a valid email address (e.g. name@example.com)",
"Geben Sie eine gültige E-Mail-Adresse ein (z. B. name@example.com)"
],
"wz_err_phone": [
"أدخل رقم موبايل مصري صحيحاً (مثال: 01012345678)",
"Enter a valid Egyptian mobile number (e.g. 01012345678)",
"Geben Sie eine gültige ägyptische Handynummer ein (z. B. 01012345678)"
],
"wz_err_nid": [
"الرقم القومي يجب أن يكون 14 رقماً",
"The national ID must be 14 digits",
"Die nationale ID muss aus 14 Ziffern bestehen"
],
"wz_err_pass_min": [
"كلمة المرور يجب ألا تقل عن {n} أحرف",
"Password must be at least {n} characters",
"Das Passwort muss mindestens {n} Zeichen lang sein"
],
"wz_err_pass_match": [
"كلمتا المرور غير متطابقتين",
"The passwords don't match",
"Die Passwörter stimmen nicht überein"
],
"wz_err_terms": [
"يجب الموافقة على الشروط للمتابعة",
"You must accept the terms to continue",
"Sie müssen den Bedingungen zustimmen, um fortzufahren"
],
"wz_err_geo": [
"حدّد موقعك على الخريطة بالضغط عليها أو بالبحث عن عنوان أو بزر الموقع الحالي.",
"Pick your location on the map by tapping it, searching for an address, or using the current-location button.",
"Wählen Sie Ihren Standort auf der Karte: antippen, eine Adresse suchen oder die Schaltfläche für den aktuellen Standort verwenden."
],
"wz_err_geo_store": [
"حدّد موقع متجرك على الخريطة قبل المتابعة.",
"Pick your store location on the map before continuing.",
"Wählen Sie den Standort Ihres Shops auf der Karte, bevor Sie fortfahren."
],
"wz_err_geo_egypt": [
"الموقع المحدّد خارج مصر. الخدمة متاحة داخل مصر فقط.",
"The selected location is outside Egypt. The service is available in Egypt only.",
"Der gewählte Standort liegt außerhalb Ägyptens. Der Dienst ist nur in Ägypten verfügbar."
],
"wz_err_file_type": [
"الملف ليس صورة. استخدم JPG أو PNG.",
"This file isn't an image. Use JPG or PNG.",
"Diese Datei ist kein Bild. Verwenden Sie JPG oder PNG."
],
"wz_err_file_big": [
"الملف كبير جداً (الحد الأقصى 25 ميجابايت).",
"The file is too large (25 MB max).",
"Die Datei ist zu groß (max. 25 MB)."
],
"wz_err_img_unreadable": [
"تعذّر قراءة الصورة «{name}». استخدم JPG أو PNG.",
"Could not read the image \"{name}\". Use JPG or PNG.",
"Das Bild „{name}“ konnte nicht gelesen werden. Verwenden Sie JPG oder PNG."
],
"wz_err_img_big": [
"حجم الصورة «{name}» كبير جداً حتى بعد الضغط.",
"The image \"{name}\" is still too large after compression.",
"Das Bild „{name}“ ist auch nach der Komprimierung zu groß."
],
"wz_err_cloud": [
"تعذّر الاتصال بالخادم.",
"Could not reach the server.",
"Verbindung zum Server fehlgeschlagen."
],
"wz_err_network": [
"تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.",
"Could not reach the server. Check your connection and try again.",
"Verbindung zum Server fehlgeschlagen. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
],
"wz_err_generic": [
"تعذّر إكمال الطلب، حاول مرة أخرى.",
"We could not complete your request. Please try again.",
"Ihre Anfrage konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut."
],
"wz_err_upload": [
"تعذّر رفع الصورة. حاول مرة أخرى.",
"Could not upload the image. Please try again.",
"Das Bild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut."
],
"wz_err_logo_upload": [
"تعذّر رفع شعار المتجر. جرّب صورة أخرى.",
"Could not upload the store logo. Try another image.",
"Das Shop-Logo konnte nicht hochgeladen werden. Versuchen Sie ein anderes Bild."
],
"wz_strength_label": [
"قوة كلمة المرور",
"Password strength",
"Passwortstärke"
],
"wz_strength_empty": [
"—",
"—",
"—"
],
"wz_strength_weak": [
"ضعيفة",
"Weak",
"Schwach"
],
"wz_strength_fair": [
"مقبولة",
"Fair",
"Mittel"
],
"wz_strength_good": [
"جيدة",
"Good",
"Gut"
],
"wz_strength_strong": [
"قوية",
"Strong",
"Stark"
],
"wz_pass_hint": [
"6 أحرف على الأقل. الأفضل خلط الحروف والأرقام والرموز.",
"At least 6 characters. Mixing letters, numbers and symbols is stronger.",
"Mindestens 6 Zeichen. Eine Mischung aus Buchstaben, Zahlen und Sonderzeichen ist sicherer."
],
"wz_st_info": [
"البيانات",
"Details",
"Angaben"
],
"wz_st_password": [
"كلمة المرور",
"Password",
"Passwort"
],
"wz_st_location": [
"الموقع",
"Location",
"Standort"
],
"wz_st_review": [
"المراجعة",
"Review",
"Prüfung"
],
"wz_st_account": [
"الحساب",
"Account",
"Konto"
],
"wz_st_store": [
"المتجر",
"Store",
"Shop"
],
"wz_st_store_location": [
"موقع المتجر",
"Store location",
"Shop-Standort"
],
"wz_st_docs": [
"المستندات",
"Documents",
"Dokumente"
],
"wz_st_vehicle": [
"المركبة",
"Vehicle",
"Fahrzeug"
],
"wz_b1_title": [
"بياناتك الأساسية",
"Your details",
"Ihre Angaben"
],
"wz_b1_desc": [
"اكتب اسمك وبريدك ورقم هاتفك لنتواصل معك بخصوص طلباتك.",
"Enter your name, email and phone so we can reach you about your orders.",
"Geben Sie Name, E-Mail und Telefonnummer an, damit wir Sie zu Ihren Bestellungen erreichen können."
],
"wz_b2_title": [
"اختر كلمة المرور",
"Choose a password",
"Passwort wählen"
],
"wz_b2_desc": [
"استخدم كلمة مرور قوية لحماية حسابك.",
"Use a strong password to protect your account.",
"Verwenden Sie ein sicheres Passwort, um Ihr Konto zu schützen."
],
"wz_b3_title": [
"أين موقعك؟",
"Where are you?",
"Wo befinden Sie sich?"
],
"wz_b3_desc": [
"حدّد موقعك داخل مصر حتى نعرض لك الأقرب إليك من المتاجر ومندوبي التوصيل.",
"Pick your location in Egypt so we can show you the nearest stores and couriers.",
"Wählen Sie Ihren Standort in Ägypten, damit wir Ihnen die nächstgelegenen Shops und Kuriere anzeigen."
],
"wz_b4_title": [
"راجع بياناتك",
"Review your details",
"Angaben prüfen"
],
"wz_review_desc": [
"تأكد أن كل شيء صحيح، ثم وافق على الشروط لإتمام التسجيل.",
"Make sure everything is correct, then accept the terms to finish.",
"Prüfen Sie alles und stimmen Sie den Bedingungen zu, um die Registrierung abzuschließen."
],
"wz_s1_title": [
"حساب التاجر",
"Seller account",
"Verkäuferkonto"
],
"wz_s1_desc": [
"بيانات الدخول الخاصة بك كصاحب المتجر.",
"Your sign-in details as the store owner.",
"Ihre Anmeldedaten als Shop-Inhaber."
],
"wz_s2_title": [
"بيانات المتجر",
"Store details",
"Shop-Angaben"
],
"wz_s2_desc": [
"عرّف المشترين بمتجرك: اسمه ونوع منتجاتك ونبذة قصيرة.",
"Tell buyers about your store: its name, what you sell and a short intro.",
"Stellen Sie Ihren Shop vor: Name, Sortiment und eine kurze Beschreibung."
],
"wz_s3_title": [
"موقع المتجر",
"Store location",
"Shop-Standort"
],
"wz_s3_desc": [
"الموقع إلزامي، والمتجر بدونه لا يظهر لأي مشترٍ. يرى المشترون متجرك ضمن نطاق 50 كم منهم.",
"The location is required: a store without one isn't shown to any buyer. Buyers within 50 km will see your store.",
"Der Standort ist Pflicht: Ein Shop ohne Standort wird keinem Käufer angezeigt. Käufer im Umkreis von 50 km sehen Ihren Shop."
],
"wz_s4_title": [
"الهوية والصور",
"ID and photos",
"Ausweis und Fotos"
],
"wz_s4_desc": [
"نراجعها قبل اعتماد المتجر، وتبقى خاصة بفريق نَسَق فقط.",
"We review them before approving the store, and they stay private to the Nasaq team.",
"Wir prüfen sie vor der Freigabe des Shops; sie sind nur für das Nasaq-Team sichtbar."
],
"wz_apply_review_title": [
"مراجعة وإرسال الطلب",
"Review and submit",
"Prüfen und absenden"
],
"wz_r1_title": [
"حساب المندوب",
"Courier account",
"Kurierkonto"
],
"wz_r1_desc": [
"بيانات الدخول الخاصة بك كمندوب توصيل.",
"Your sign-in details as a delivery courier.",
"Ihre Anmeldedaten als Lieferkurier."
],
"wz_r2_title": [
"منطقة ووسيلة التوصيل",
"Area and vehicle",
"Gebiet und Fahrzeug"
],
"wz_r2_desc": [
"اختر وسيلة التوصيل المتوفرة معك والمنطقة التي تغطيها.",
"Choose your delivery vehicle and the area you cover.",
"Wählen Sie Ihr Fahrzeug und das Gebiet, das Sie abdecken."
],
"wz_r3_title": [
"الهوية والصور",
"ID and photos",
"Ausweis und Fotos"
],
"wz_r3_desc": [
"نراجعها قبل اعتماد حسابك، وتبقى خاصة بفريق نَسَق فقط.",
"We review them before approving your account, and they stay private to the Nasaq team.",
"Wir prüfen sie vor der Freigabe Ihres Kontos; sie sind nur für das Nasaq-Team sichtbar."
],
"wz_f_name": [
"الاسم بالكامل",
"Full name",
"Vollständiger Name"
],
"wz_f_email": [
"البريد الإلكتروني",
"Email",
"E-Mail"
],
"wz_f_phone": [
"رقم الهاتف",
"Phone number",
"Telefonnummer"
],
"wz_f_password": [
"كلمة المرور",
"Password",
"Passwort"
],
"wz_f_password2": [
"تأكيد كلمة المرور",
"Confirm password",
"Passwort bestätigen"
],
"wz_f_location": [
"الموقع",
"Location",
"Standort"
],
"wz_f_store_name": [
"اسم المتجر / المحل التجاري",
"Store / business name",
"Shop- / Geschäftsname"
],
"wz_f_category": [
"نوع المنتجات",
"Product category",
"Produktkategorie"
],
"wz_f_description": [
"نبذة عن المتجر",
"About the store",
"Über den Shop"
],
"wz_f_license": [
"رقم الترخيص / السجل التجاري",
"License / commercial register no.",
"Lizenz- / Handelsregisternummer"
],
"wz_f_logo": [
"شعار المتجر",
"Store logo",
"Shop-Logo"
],
"wz_f_address": [
"عنوان المحل بالتفصيل",
"Store address in detail",
"Detaillierte Shop-Adresse"
],
"wz_f_store_location": [
"موقع المتجر على الخريطة",
"Store location on the map",
"Shop-Standort auf der Karte"
],
"wz_f_nid": [
"الرقم القومي (14 رقم)",
"National ID (14 digits)",
"Nationale ID (14 Ziffern)"
],
"wz_f_nid_short": [
"الرقم القومي",
"National ID",
"Nationale ID"
],
"wz_f_photo_personal": [
"صورة شخصية حديثة",
"Recent personal photo",
"Aktuelles Porträtfoto"
],
"wz_f_photo_storefront": [
"صورة واجهة المحل أو اللافتة",
"Storefront or signboard photo",
"Foto der Ladenfront oder des Schildes"
],
"wz_f_photo_id": [
"صورة البطاقة الشخصية (وجه وظهر)",
"ID card photo (front and back)",
"Foto des Personalausweises (Vorder- und Rückseite)"
],
"wz_f_vehicle": [
"وسيلة التوصيل المتوفرة معك",
"Your delivery vehicle",
"Ihr Lieferfahrzeug"
],
"wz_f_vehicle_short": [
"وسيلة التوصيل",
"Delivery vehicle",
"Lieferfahrzeug"
],
"wz_f_gov": [
"المحافظة",
"Governorate",
"Gouvernement"
],
"wz_f_area": [
"الحي / المدينة",
"District / city",
"Stadtteil / Stadt"
],
"wz_f_range": [
"حدود ونطاق التوصيل المتاح لك",
"Your delivery range",
"Ihr Liefergebiet"
],
"wz_f_files": [
"الصور المرفقة",
"Attached photos",
"Angehängte Fotos"
],
"wz_veh_motorbike": [
"موتوسيكل",
"Motorbike",
"Motorrad"
],
"wz_veh_scooter": [
"سكوتر",
"Scooter",
"Roller"
],
"wz_veh_car": [
"سيارة",
"Car",
"Auto"
],
"wz_veh_bike": [
"عجلة / هوائية",
"Bicycle",
"Fahrrad"
],
"wz_cat_clothes": [
"ملابس",
"Clothing",
"Kleidung"
],
"wz_pick_gov": [
"اختر المحافظة",
"Choose governorate",
"Gouvernement wählen"
],
"wz_gov_0": [
"القاهرة",
"Cairo",
"Kairo"
],
"wz_gov_1": [
"الجيزة",
"Giza",
"Gizeh"
],
"wz_gov_2": [
"القليوبية",
"Qalyubia",
"Qalyubia"
],
"wz_gov_3": [
"الإسكندرية",
"Alexandria",
"Alexandria"
],
"wz_gov_4": [
"الدقهلية",
"Dakahlia",
"Dakahlia"
],
"wz_gov_5": [
"الشرقية",
"Sharqia",
"Scharqia"
],
"wz_gov_6": [
"أخرى",
"Other",
"Andere"
],
"wz_ph_fullname": [
"أدخل اسمك الثلاثي أو الرباعي كما في البطاقة",
"Enter your full name as on your ID",
"Geben Sie Ihren vollständigen Namen wie im Ausweis ein"
],
"wz_ph_nid": [
"أدخل 14 رقماً بالبطاقة الشخصية",
"Enter the 14 digits on your ID card",
"Geben Sie die 14 Ziffern Ihres Ausweises ein"
],
"wz_ph_store_name": [
"مثال: نَسَق تك ستور",
"e.g. Nasaq Tech Store",
"z. B. Nasaq Tech Store"
],
"wz_ph_license": [
"رقم السجل التجاري إن وجد",
"Commercial register number, if any",
"Handelsregisternummer, falls vorhanden"
],
"wz_ph_description": [
"ماذا تبيع؟ وما الذي يميّز متجرك؟",
"What do you sell, and what makes your store special?",
"Was verkaufen Sie und was macht Ihren Shop besonders?"
],
"wz_ph_address": [
"المحافظة، المركز أو الحي، اسم الشارع، علامة مميزة بجوار المحل",
"Governorate, district, street name, a landmark next to the store",
"Gouvernement, Bezirk, Straße, ein Wahrzeichen in der Nähe"
],
"wz_ph_area": [
"مثال: المعادي، مدينتي",
"e.g. Maadi, Madinaty",
"z. B. Maadi, Madinaty"
],
"wz_ph_range": [
"مثال: التجمع، المعادي، مدينتي (أو نطاق 15 كم)",
"e.g. New Cairo, Maadi, Madinaty (or a 15 km radius)",
"z. B. Neu-Kairo, Maadi, Madinaty (oder 15 km Umkreis)"
],
"wz_ph_pass": [
"6 أحرف أو أرقام على الأقل",
"At least 6 letters or numbers",
"Mindestens 6 Buchstaben oder Zahlen"
],
"wz_ph_pass2": [
"أعد إدخال كلمة المرور",
"Re-enter your password",
"Passwort erneut eingeben"
],
"wz_dz_personal": [
"انقر لرفع الصورة الشخصية",
"Click to upload your photo",
"Klicken, um Ihr Foto hochzuladen"
],
"wz_dz_personal_hint": [
"PNG أو JPG (صورة واضحة للوجه)",
"PNG or JPG (clear photo of your face)",
"PNG oder JPG (Gesicht gut erkennbar)"
],
"wz_dz_storefront": [
"انقر لرفع صورة واجهة المحل أو اللافتة",
"Click to upload a storefront or signboard photo",
"Klicken, um ein Foto der Ladenfront oder des Schildes hochzuladen"
],
"wz_dz_storefront_hint": [
"تساعد صورة الواجهة المتصفحين والعملاء على تمييز موقعك بدقة",
"The storefront photo helps people recognise your exact location",
"Das Foto der Ladenfront hilft, Ihren Standort eindeutig zu erkennen"
],
"wz_dz_id": [
"ارفع صورة الوجه والظهر للبطاقة",
"Upload the front and back of your ID",
"Laden Sie Vorder- und Rückseite Ihres Ausweises hoch"
],
"wz_dz_id_hint": [
"تأكد من وضوح الأرقام وسريان البطاقة",
"Make sure the numbers are clear and the card is valid",
"Achten Sie auf gut lesbare Ziffern und einen gültigen Ausweis"
],
"wz_dz_rider_photo": [
"اضغط لرفع الصورة أو التقاطها",
"Tap to upload or take a photo",
"Tippen, um ein Foto hochzuladen oder aufzunehmen"
],
"wz_dz_rider_photo_hint": [
"خلفية بيضاء وواضحة (PNG أو JPG)",
"Clear photo on a white background (PNG or JPG)",
"Klares Foto vor weißem Hintergrund (PNG oder JPG)"
],
"wz_dz_logo": [
"انقر لاختيار شعار المتجر",
"Click to choose the store logo",
"Klicken, um das Shop-Logo auszuwählen"
],
"wz_dz_logo_hint": [
"صورة مربعة واضحة",
"A clear square image",
"Ein klares quadratisches Bild"
],
"wz_notice_seller_title": [
"تنويه هام بشأن اعتماد وتفعيل الحساب",
"Important: account approval",
"Wichtig: Freigabe des Kontos"
],
"wz_notice_seller": [
"تتم مراجعة حسابك واعتماده خلال 12 ساعة من فريق عمليات نَسَق بعد التحقق من المستندات والصور المرفقة، وسيصلك إشعار فور الاعتماد.",
"Your account is reviewed and approved within 12 hours by the Nasaq operations team after verifying your documents and photos. You'll be notified as soon as it's approved.",
"Ihr Konto wird vom Nasaq-Team innerhalb von 12 Stunden nach Prüfung der Dokumente und Fotos freigegeben. Sie werden benachrichtigt, sobald es freigegeben ist."
],
"wz_notice_rider_title": [
"ملاحظة هامة وتأكيد الحساب",
"Important: account confirmation",
"Wichtig: Bestätigung des Kontos"
],
"wz_notice_rider": [
"تتم مراجعة بياناتك وصور المستندات وتفعيل حسابك خلال 12 ساعة من فريق عمليات نَسَق، وسنرسل لك إشعاراً عبر واتساب والرسائل النصية.",
"Your details and documents are reviewed and your account is activated within 12 hours by the Nasaq operations team. We'll notify you via WhatsApp and text message.",
"Ihre Angaben und Dokumente werden geprüft und Ihr Konto wird vom Nasaq-Team innerhalb von 12 Stunden aktiviert. Wir benachrichtigen Sie per WhatsApp und SMS."
],
"wz_terms_buyer": [
"أوافق على شروط الاستخدام وسياسة الخصوصية",
"I agree to the Terms of Use and Privacy Policy",
"Ich stimme den Nutzungsbedingungen und der Datenschutzerklärung zu"
],
"wz_terms_seller": [
"أوافق على شروط الاستخدام واتفاقية بائعي أسواق نَسَق وسياسة الخصوصية",
"I agree to the Terms of Use, the Nasaq Marketplace Seller Agreement and the Privacy Policy",
"Ich stimme den Nutzungsbedingungen, der Nasaq-Marktplatz-Verkäufervereinbarung und der Datenschutzerklärung zu"
],
"wz_terms_rider": [
"أوافق على شروط الاستخدام واتفاقية مندوبي التوصيل وإشعار الخصوصية المعمول به في منصة نَسَق",
"I agree to the Terms of Use, the Courier Agreement and the Privacy Notice that apply on Nasaq",
"Ich stimme den Nutzungsbedingungen, der Kurriervereinbarung und den auf Nasaq geltenden Datenschutzhinweisen zu"
],
"wz_submit_buyer": [
"إنشاء الحساب",
"Create account",
"Konto erstellen"
],
"wz_submit_seller": [
"تقديم طلب فتح حساب تاجر",
"Submit seller application",
"Verkäuferantrag senden"
],
"wz_submit_rider": [
"تقديم طلب الانضمام كمندوب توصيل",
"Submit courier application",
"Kurierbewerbung senden"
],
"wz_ok_buyer_title": [
"تم إنشاء حسابك بنجاح",
"Your account is ready",
"Ihr Konto wurde erstellt"
],
"wz_ok_buyer_desc": [
"أهلاً بك في نَسَق! سننقلك إلى الصفحة الرئيسية.",
"Welcome to Nasaq! We're taking you to the home page.",
"Willkommen bei Nasaq! Sie werden zur Startseite weitergeleitet."
],
"wz_ok_buyer_cta": [
"ابدأ التسوق",
"Start shopping",
"Jetzt einkaufen"
],
"wz_ok_app_title": [
"طلبك قيد المراجعة",
"Your application is under review",
"Ihr Antrag wird geprüft"
],
"wz_ok_app_desc": [
"استلمنا طلبك وسيراجعه فريق نَسَق خلال 12 ساعة. احتفظ برقم الطلب للمتابعة.",
"We received your application and the Nasaq team will review it within 12 hours. Keep your request number for follow-up.",
"Wir haben Ihren Antrag erhalten; das Nasaq-Team prüft ihn innerhalb von 12 Stunden. Bewahren Sie Ihre Antragsnummer auf."
],
"wz_ok_app_id": [
"رقم الطلب",
"Request number",
"Antragsnummer"
],
"wz_ok_app_cta": [
"متابعة حالة الطلب",
"Track your application",
"Antragsstatus ansehen"
],
"wz_redirecting": [
"سيتم تحويلك تلقائياً خلال {n} ثوانٍ",
"Redirecting automatically in {n} seconds",
"Automatische Weiterleitung in {n} Sekunden"
]
},
"phrases": {
"الصفحة الرئيسية": [
"Home",
"Startseite"
],
"الرئيسية": [
"Home",
"Start"
],
"السلة": [
"Cart",
"Warenkorb"
],
"سلة التسوق": [
"Shopping Cart",
"Warenkorb"
],
"إتمام الطلب": [
"Checkout",
"Zur Kasse"
],
"إضافة للسلة": [
"Add to Cart",
"In den Warenkorb"
],
"أضف إلى السلة": [
"Add to Cart",
"In den Warenkorb"
],
"وصف المنتج": [
"Product Description",
"Produktbeschreibung"
],
"تسجيل الدخول": [
"Log in",
"Anmelden"
],
"تسجيل الخروج": [
"Log out",
"Abmelden"
],
"إنشاء حساب جديد": [
"Create a new account",
"Neues Konto erstellen"
],
"كل المنتجات": [
"All Products",
"Alle Produkte"
],
"بحث": [
"Search",
"Suchen"
],
"المفضلة": [
"Favorites",
"Favoriten"
],
"حسابي": [
"My Account",
"Mein Konto"
],
"اللغة": [
"Language",
"Sprache"
],
"حفظ": [
"Save",
"Speichern"
],
"إلغاء": [
"Cancel",
"Abbrechen"
],
"إغلاق": [
"Close",
"Schließen"
],
"تأكيد": [
"Confirm",
"Bestätigen"
],
"حذف": [
"Remove",
"Entfernen"
],
"تعديل": [
"Edit",
"Bearbeiten"
],
"الطلبات": [
"Orders",
"Bestellungen"
],
"السعر": [
"Price",
"Preis"
],
"الكمية": [
"Quantity",
"Menge"
],
"الإجمالي": [
"Total",
"Gesamt"
],
"المجموع الفرعي": [
"Subtotal",
"Zwischensumme"
],
"الشحن": [
"Shipping",
"Versand"
],
"مجاني": [
"Free",
"Kostenlos"
],
"الفئة": [
"Category",
"Kategorie"
],
"اللون": [
"Color",
"Farbe"
],
"المقاس": [
"Size",
"Größe"
],
"القائمة": [
"Menu",
"Menü"
],
"بتاع محلات كل ما تحتاجه في مكان واحد": [
"All you need in one place",
"Alles, was Sie brauchen, an einem Ort"
],
"نَسَق: سوق عربي موثوق لكل احتياجاتك، إلكترونيات وأجهزة منزلية وأزياء وجمال وسوبر ماركت وأكثر. شحن مجاني فوق {n} ج.م وإرجاع خلال {n} يوماً.": [
"Nasaq: a trusted Arabic marketplace for all your needs — electronics, home appliances, fashion, beauty, supermarket and more. Free shipping over {n} EGP and returns within {n} days.",
"Nasaq: ein vertrauenswürdiger arabischer Marktplatz für alle Ihre Bedürfnisse – Elektronik, Haushaltsgeräte, Mode, Schönheit, Supermarkt und mehr. Kostenloser Versand ab {n} EGP und Rückgabe innerhalb von {n} Tagen."
],
"نَسَق | أناقة هادئة لكل يوم": [
"Nasaq | Calm elegance for every day",
"Nasaq | Ruhige Eleganz für jeden Tag"
],
"قطع مختارة بعناية بخامات عالية الجودة وتصاميم بسيطة.": [
"Carefully selected pieces in high-quality materials and simple designs.",
"Sorgfältig ausgewählte Stücke aus hochwertigen Materialien in schlichtem Design."
],
"يحتاج المتجر إلى تفعيل JavaScript لعرض المنتجات وإدارة السلة.": [
"The store needs JavaScript enabled to show products and manage the cart.",
"Der Shop benötigt JavaScript, um Produkte anzuzeigen und den Warenkorb zu verwalten."
],
"لافتات وعروض المتجر": [
"Store banners and offers",
"Shop-Banner und Angebote"
],
"تسوّق بسرعة": [
"Quick shop",
"Schnell einkaufen"
],
"منتجات قد تهمّك": [
"Products you may like",
"Produkte, die Sie interessieren könnten"
],
"وصل حديثاً": [
"New arrivals",
"Neu eingetroffen"
],
"عرض الكل": [
"View all",
"Alle anzeigen"
],
"عروض لفترة محدودة": [
"Limited-time offers",
"Zeitlich begrenzte Angebote"
],
"شاهدتها مؤخراً": [
"Recently viewed",
"Zuletzt angesehen"
],
"سجّل الدخول لرؤية توصيات تناسبك": [
"Log in to see recommendations for you",
"Melden Sie sich an, um Empfehlungen für Sie zu sehen"
],
"ليس لديك حساب؟": [
"Don't have an account?",
"Noch kein Konto?"
],
"أنشئ حسابك": [
"Create your account",
"Konto erstellen"
],
"مزايا التسوق": [
"Shopping benefits",
"Vorteile beim Einkaufen"
],
"شحن مجاني فوق {n} ج.م": [
"Free shipping over {n} EGP",
"Kostenloser Versand ab {n} EGP"
],
"يصلك الطلب خلال {n} إلى {n} أيام عمل، أو أسرع بالشحن السريع.": [
"Your order arrives within {n} to {n} business days, or faster with express shipping.",
"Ihre Bestellung kommt innerhalb von {n} bis {n} Werktagen an, mit Expressversand noch schneller."
],
"إرجاع خلال {n} يوماً": [
"Returns within {n} days",
"Rückgabe innerhalb von {n} Tagen"
],
"لم تناسبك القطعة؟ أعدها بحالتها الأصلية واسترد مبلغك كاملاً.": [
"Doesn't fit? Return it in its original condition and get a full refund.",
"Passt nicht? Senden Sie es im Originalzustand zurück und erhalten Sie den vollen Betrag erstattet."
],
"دفع آمن": [
"Secure payment",
"Sichere Zahlung"
],
"ادفع بالبطاقة أو عند الاستلام، وبياناتك محمية دائماً.": [
"Pay by card or on delivery — your data is always protected.",
"Zahlen Sie per Karte oder bei Lieferung – Ihre Daten sind immer geschützt."
],
"كن أول من يعرف بالقطع الجديدة": [
"Be the first to know about new arrivals",
"Erfahren Sie als Erste(r) von neuen Artikeln"
],
"رسالة واحدة كل أسبوعين، بلا إزعاج.": [
"One email every two weeks, no spam.",
"Eine E-Mail alle zwei Wochen, kein Spam."
],
"البريد الإلكتروني": [
"Email",
"E-Mail"
],
"بريدك الإلكتروني": [
"Your email",
"Ihre E-Mail-Adresse"
],
"اشترك": [
"Subscribe",
"Abonnieren"
],
"كل المنتجات | نَسَق": [
"All Products | Nasaq",
"Alle Produkte | Nasaq"
],
"تصفّح ملابس وحقائب وأحذية وإكسسوارات نَسَق. ابحث ورتّب وصفِّ حسب الفئة والسعر.": [
"Browse Nasaq clothing, bags, shoes and accessories. Search, sort and filter by category and price.",
"Stöbern Sie in Nasaq-Kleidung, Taschen, Schuhen und Accessoires. Suchen, sortieren und filtern nach Kategorie und Preis."
],
"مسار التنقل": [
"Breadcrumb",
"Brotkrumennavigation"
],
"تصفية المنتجات": [
"Filter products",
"Produkte filtern"
],
"السعر (ج.م)": [
"Price (EGP)",
"Preis (EGP)"
],
"أقل سعر": [
"Minimum price",
"Mindestpreis"
],
"من": [
"From",
"Von"
],
"أعلى سعر": [
"Maximum price",
"Höchstpreis"
],
"إلى": [
"To",
"Bis"
],
"العرض": [
"Availability",
"Verfügbarkeit"
],
"المتوفر فقط": [
"In stock only",
"Nur verfügbare"
],
"العروض فقط": [
"Offers only",
"Nur Angebote"
],
"إعادة ضبط الفلاتر": [
"Reset filters",
"Filter zurücksetzen"
],
"نتائج المنتجات": [
"Product results",
"Produktergebnisse"
],
"الفلاتر": [
"Filters",
"Filter"
],
"ابحث في المنتجات": [
"Search products",
"Produkte suchen"
],
"ابحث في المنتجات…": [
"Search products…",
"Produkte suchen…"
],
"الترتيب": [
"Sort by",
"Sortieren nach"
],
"الأكثر رواجاً": [
"Most popular",
"Am beliebtesten"
],
"الأحدث": [
"Newest",
"Neueste"
],
"السعر: من الأقل": [
"Price: low to high",
"Preis: aufsteigend"
],
"السعر: من الأعلى": [
"Price: high to low",
"Preis: absteigend"
],
"الأعلى تقييماً": [
"Top rated",
"Am besten bewertet"
],
"الأكبر خصماً": [
"Biggest discount",
"Höchster Rabatt"
],
"المنتج | نَسَق": [
"Product | Nasaq",
"Produkt | Nasaq"
],
"تفاصيل المنتج من متجر نَسَق.": [
"Product details from the Nasaq store.",
"Produktdetails aus dem Nasaq-Shop."
],
"يحتاج عرض المنتج إلى تفعيل JavaScript.": [
"Viewing the product requires JavaScript.",
"Für die Produktansicht wird JavaScript benötigt."
],
"سلة التسوق | نَسَق": [
"Shopping Cart | Nasaq",
"Warenkorb | Nasaq"
],
"راجع منتجاتك وعدّل الكميات وطبّق كود الخصم قبل إتمام الطلب.": [
"Review your items, adjust quantities and apply a discount code before checkout.",
"Prüfen Sie Ihre Artikel, ändern Sie Mengen und lösen Sie einen Rabattcode ein, bevor Sie bestellen."
],
"تحتاج السلة إلى تفعيل JavaScript.": [
"The cart requires JavaScript.",
"Der Warenkorb benötigt JavaScript."
],
"إتمام الطلب | نَسَق": [
"Checkout | Nasaq",
"Kasse | Nasaq"
],
"أدخل بيانات الشحن والدفع لإتمام طلبك من نَسَق.": [
"Enter your shipping and payment details to complete your Nasaq order.",
"Geben Sie Ihre Versand- und Zahlungsdaten ein, um Ihre Nasaq-Bestellung abzuschließen."
],
"يحتاج إتمام الطلب إلى تفعيل JavaScript.": [
"Checkout requires JavaScript.",
"Die Kasse benötigt JavaScript."
],
"بيانات التواصل": [
"Contact details",
"Kontaktdaten"
],
"الاسم الكامل": [
"Full name",
"Vollständiger Name"
],
"رقم الجوال": [
"Mobile number",
"Handynummer"
],
"عنوان الشحن": [
"Shipping address",
"Lieferadresse"
],
"العنوان": [
"Address",
"Adresse"
],
"الحي، الشارع، رقم المبنى": [
"District, street, building number",
"Viertel, Straße, Hausnummer"
],
"المدينة": [
"City",
"Stadt"
],
"الرمز البريدي": [
"Postal code",
"Postleitzahl"
],
"(اختياري)": [
"(optional)",
"(optional)"
],
"ملاحظات للتوصيل": [
"Delivery notes",
"Hinweise zur Lieferung"
],
"طريقة الشحن": [
"Shipping method",
"Versandart"
],
"شحن عادي": [
"Standard shipping",
"Standardversand"
],
"من {n} إلى {n} أيام عمل": [
"{n} to {n} business days",
"{n} bis {n} Werktage"
],
"شحن سريع": [
"Express shipping",
"Expressversand"
],
"من {n} إلى {n} يوم عمل": [
"{n} to {n} business days",
"{n} bis {n} Werktage"
],
"طريقة الدفع": [
"Payment method",
"Zahlungsart"
],
"بطاقة بنكية": [
"Bank card",
"Bankkarte"
],
"رقم البطاقة": [
"Card number",
"Kartennummer"
],
"الاسم على البطاقة": [
"Name on card",
"Name auf der Karte"
],
"تاريخ الانتهاء": [
"Expiry date",
"Ablaufdatum"
],
"رمز الأمان (CVV)": [
"Security code (CVV)",
"Sicherheitscode (CVV)"
],
"الدفع عند الاستلام": [
"Cash on delivery",
"Zahlung bei Lieferung"
],
"ادفع نقداً للمندوب عند وصول الطلب": [
"Pay the courier in cash when your order arrives",
"Zahlen Sie bar beim Kurier, wenn Ihre Bestellung ankommt"
],
"بياناتك مشفّرة ولا تُخزَّن على هذا الجهاز.": [
"Your data is encrypted and not stored on this device.",
"Ihre Daten sind verschlüsselt und werden nicht auf diesem Gerät gespeichert."
],
"أوافق على شروط الشراء وسياسة الإرجاع": [
"I agree to the purchase terms and return policy",
"Ich stimme den Kaufbedingungen und der Rückgaberichtlinie zu"
],
"ملخص الطلب": [
"Order summary",
"Bestellübersicht"
],
"متجر | نَسَق": [
"Store | Nasaq",
"Shop | Nasaq"
],
"تسجيل الدخول | نَسَق": [
"Log in | Nasaq",
"Anmelden | Nasaq"
],
"سجّل دخولك إلى حسابك في نَسَق أو أنشئ حساباً جديداً لإدارة طلباتك ومفضلاتك.": [
"Log in to your Nasaq account or create a new one to manage your orders and favorites.",
"Melden Sie sich bei Ihrem Nasaq-Konto an oder erstellen Sie ein neues, um Ihre Bestellungen und Favoriten zu verwalten."
],
"يحتاج تسجيل الدخول إلى تفعيل JavaScript.": [
"Logging in requires JavaScript.",
"Die Anmeldung benötigt JavaScript."
],
"نوع الصفحة": [
"Page type",
"Seitentyp"
],
"مرحباً بك مجدداً في نَسَق. سجّل دخولك لإدارة طلباتك ومشترياتك.": [
"Welcome back to Nasaq. Log in to manage your orders and purchases.",
"Willkommen zurück bei Nasaq. Melden Sie sich an, um Ihre Bestellungen und Einkäufe zu verwalten."
],
"الاسم أو رقم الهاتف أو البريد الإلكتروني": [
"Name, phone number or email",
"Name, Telefonnummer oder E-Mail"
],
"مثال: {n} أو الاسم": [
"Example: {n} or name",
"Beispiel: {n} oder Name"
],
"كلمة المرور": [
"Password",
"Passwort"
],
"هل نسيت كلمة المرور؟": [
"Forgot your password?",
"Passwort vergessen?"
],
"أدخل كلمة المرور الخاصة بك": [
"Enter your password",
"Geben Sie Ihr Passwort ein"
],
"تذكرني على هذا الجهاز": [
"Remember me on this device",
"Auf diesem Gerät angemeldet bleiben"
],
"ليس لديك حساب حتى الآن؟": [
"Don't have an account yet?",
"Noch kein Konto?"
],
"إنشاء حسابك الآن": [
"Create your account now",
"Jetzt Konto erstellen"
],
"انضم إلى نَسَق في أقل من دقيقة، وتابع طلباتك وقائمة مفضلاتك بسهولة.": [
"Join Nasaq in under a minute and easily track your orders and favorites.",
"Treten Sie Nasaq in unter einer Minute bei und verfolgen Sie Ihre Bestellungen und Favoriten ganz einfach."
],
"الاسم بالكامل": [
"Full name",
"Vollständiger Name"
],
"رقم الهاتف": [
"Phone number",
"Telefonnummer"
],
"موقعك": [
"Your location",
"Ihr Standort"
],
"حدّد موقعك على الخريطة حتى يظهر متجرك ومندوب التوصيل الأقرب لك بدقة.": [
"Set your location on the map so the nearest store and courier can be shown accurately.",
"Legen Sie Ihren Standort auf der Karte fest, damit der nächstgelegene Shop und Kurier genau angezeigt werden."
],
"أوافق على شروط الاستخدام وسياسة الخصوصية": [
"I agree to the terms of use and privacy policy",
"Ich stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu"
],
"إنشاء الحساب": [
"Create account",
"Konto erstellen"
],
"لديك حساب بالفعل؟": [
"Already have an account?",
"Sie haben bereits ein Konto?"
],
"عايز تبيع معانا؟": [
"Want to sell with us?",
"Möchten Sie bei uns verkaufen?"
],
"انضم كبائع شريك": [
"Join as a partner seller",
"Als Partnerverkäufer beitreten"
],
"— أو —": [
"— or —",
"— oder —"
],
"انضم كمندوب توصيل": [
"Join as a delivery courier",
"Als Lieferkurier beitreten"
],
"حسابي | نَسَق": [
"My Account | Nasaq",
"Mein Konto | Nasaq"
],
"بيانات حسابك وطلباتك في نَسَق.": [
"Your account details and orders on Nasaq.",
"Ihre Kontodaten und Bestellungen bei Nasaq."
],
"تحتاج هذه الصفحة إلى تفعيل JavaScript.": [
"This page requires JavaScript.",
"Diese Seite benötigt JavaScript."
],
"لوحة الدعم — نَسَق": [
"Support Panel — Nasaq",
"Support-Bereich — Nasaq"
],
"لوحة الدعم": [
"Support Panel",
"Support-Bereich"
],
"خروج": [
"Log out",
"Abmelden"
],
"السعر قبل الخصم": [
"Price before discount",
"Preis vor Rabatt"
],
"يبعد عنك": [
"away from you",
"von Ihnen entfernt"
],
"جديد · بلا تقييمات بعد": [
"New · No reviews yet",
"Neu · Noch keine Bewertungen"
],
"التقييم": [
"Rating",
"Bewertung"
],
"من {n}": [
"out of {n}",
"von {n}"
],
"نفدت الكمية": [
"Out of stock",
"Ausverkauft"
],
"جديد": [
"New",
"Neu"
],
"خصم": [
"Discount",
"Rabatt"
],
"مموَّل": [
"Sponsored",
"Gesponsert"
],
"إعلان": [
"Ad",
"Anzeige"
],
"تسوّق الآن": [
"Shop now",
"Jetzt einkaufen"
],
"المفضلة:": [
"Favorites:",
"Favoriten:"
],
"إضافة للسلة، اختر المقاس": [
"Add to cart, choose a size",
"In den Warenkorb, Größe wählen"
],
"اختر المقاس لإضافة": [
"Choose a size to add",
"Größe wählen zum Hinzufügen"
],
"إضافة": [
"Add",
"Hinzufügen"
],
"مقاس": [
"Size",
"Größe"
],
"إلى السلة": [
"to cart",
"in den Warenkorb"
],
"الأكثر مبيعاً في": [
"Best sellers in",
"Bestseller in"
],
"السعر قبل الخصم:": [
"Price before discount:",
"Preis vor Rabatt:"
],
"يصلك": [
"Arrives",
"Lieferung"
],
"عرض الكل:": [
"View all:",
"Alle anzeigen:"
],
"عرض المزيد": [
"Show more",
"Mehr anzeigen"
],
"كاروسيل": [
"Carousel",
"Karussell"
],
"صفحة": [
"Page",
"Seite"
],
"تحديث الموقع": [
"Update location",
"Standort aktualisieren"
],
"حدّد موقعك لنعرض لك المتاجر القريبة منك": [
"Set your location to see stores near you",
"Legen Sie Ihren Standort fest, um Shops in Ihrer Nähe zu sehen"
],
"نعرض فقط المتاجر والمنتجات التي تبعد عنك": [
"We only show stores and products within",
"Wir zeigen nur Shops und Produkte im Umkreis von"
],
"كم أو أقل، حسب موقعك الفعلي.": [
"km or less of your actual location.",
"km oder weniger von Ihrem tatsächlichen Standort."
],
"استخدم موقعي الحالي": [
"Use my current location",
"Meinen aktuellen Standort verwenden"
],
"تحديد الموقع من حسابي": [
"Use my saved location",
"Standort aus meinem Konto verwenden"
],
"أنشئ حساباً واحفظ موقعك": [
"Create an account and save your location",
"Konto erstellen und Standort speichern"
],
"جارٍ تحديد موقعك…": [
"Locating you…",
"Standort wird ermittelt…"
],
"تعذّر تحديد موقعك، حاول لاحقاً.": [
"Couldn't determine your location, please try again later.",
"Standort konnte nicht ermittelt werden, bitte später erneut versuchen."
],
"اللون:": [
"Color:",
"Farbe:"
],
"المقاس:": [
"Size:",
"Größe:"
],
"الكمية:": [
"Quantity:",
"Menge:"
],
"إنقاص الكمية": [
"Decrease quantity",
"Menge verringern"
],
"زيادة الكمية": [
"Increase quantity",
"Menge erhöhen"
],
"من السلة": [
"from cart",
"aus dem Warenkorb"
],
"الشحن العادي مجاني على هذا الطلب": [
"Standard shipping is free on this order",
"Standardversand ist für diese Bestellung kostenlos"
],
"أضف": [
"Add",
"Fügen Sie"
],
"للحصول على شحن مجاني": [
"more to get free shipping",
"hinzu für kostenlosen Versand"
],
"التقدم نحو الشحن المجاني": [
"Progress toward free shipping",
"Fortschritt zum kostenlosen Versand"
],
"الكوبون": [
"Coupon",
"Gutschein"
],
"مُفعّل": [
"Applied",
"Angewendet"
],
"إزالة": [
"Remove",
"Entfernen"
],
"كود الخصم": [
"Discount code",
"Rabattcode"
],
"تطبيق": [
"Apply",
"Anwenden"
],
"كوبون": [
"Coupon",
"Gutschein"
],
"وفّرت": [
"You saved",
"Sie sparen"
],
"من خصومات المنتجات": [
"from product discounts",
"durch Produktrabatte"
],
"سلتك فارغة": [
"Your cart is empty",
"Ihr Warenkorb ist leer"
],
"ابدأ بإضافة قطعة تعجبك وستظهر هنا.": [
"Start by adding an item you like and it will appear here.",
"Fügen Sie einen Artikel hinzu, der Ihnen gefällt, und er erscheint hier."
],
"تصفّح المنتجات": [
"Browse products",
"Produkte durchstöbern"
],
"الشحن والكوبونات تُحسب في الخطوة التالية.": [
"Shipping and coupons are calculated in the next step.",
"Versand und Gutscheine werden im nächsten Schritt berechnet."
],
"عرض السلة": [
"View cart",
"Warenkorb anzeigen"
],
"عميل جديد؟": [
"New customer?",
"Neukunde?"
],
"بيع منتجاتك معنا": [
"Sell your products with us",
"Verkaufen Sie Ihre Produkte bei uns"
],
"لوحة الإدارة": [
"Admin Panel",
"Admin-Bereich"
],
"لوحة البائع": [
"Seller Dashboard",
"Verkäufer-Dashboard"
],
"لوحة المندوب": [
"Courier Dashboard",
"Kurier-Dashboard"
],
"إدارة الحساب": [
"Manage account",
"Konto verwalten"
],
"الملف الشخصي والطلبات": [
"Profile and orders",
"Profil und Bestellungen"
],
"الكل": [
"All",
"Alle"
],
"فتح القائمة": [
"Open menu",
"Menü öffnen"
],
"التوصيل إلى": [
"Deliver to",
"Lieferung nach"
],
"ابحث في المتجر": [
"Search the store",
"Im Shop suchen"
],
"البحث في فئة": [
"Search in category",
"In Kategorie suchen"
],
"ابحث عن منتج، لون، فئة…": [
"Search for a product, color, category…",
"Nach Produkt, Farbe, Kategorie suchen…"
],
"تغيير اللغة": [
"Change language",
"Sprache ändern"
],
"تسجيل الدخول والحساب": [
"Log in and account",
"Anmelden und Konto"
],
"مرحباً بعودتك": [
"Welcome back",
"Willkommen zurück"
],
"أهلاً، سجّل الدخول": [
"Hello, log in",
"Hallo, bitte anmelden"
],
"الحساب والمفضلة": [
"Account and favorites",
"Konto und Favoriten"
],
"التنقل السفلي": [
"Bottom navigation",
"Untere Navigation"
],
"دخول": [
"Log in",
"Anmelden"
],
"عروض اليوم": [
"Today's deals",
"Angebote des Tages"
],
"الكوبونات": [
"Coupons",
"Gutscheine"
],
"بيع معنا": [
"Sell with us",
"Bei uns verkaufen"
],
"التنقل الرئيسي": [
"Main navigation",
"Hauptnavigation"
],
"مزايا المتجر": [
"Store benefits",
"Shop-Vorteile"
],
"شحن مجاني فوق": [
"Free shipping over",
"Kostenloser Versand ab"
],
"إرجاع مجاني": [
"Free returns",
"Kostenlose Rückgabe"
],
"عمليات بحث شائعة": [
"Popular searches",
"Beliebte Suchanfragen"
],
"الأكثر بحثاً": [
"Most searched",
"Meistgesucht"
],
"إغلاق القائمة": [
"Close menu",
"Menü schließen"
],
"اللغة:": [
"Language:",
"Sprache:"
],
"اللغة / Language": [
"Language / اللغة",
"Sprache / Language"
],
"اختر اللغة": [
"Choose language",
"Sprache wählen"
],
"تسوّق حسب الفئة": [
"Shop by category",
"Nach Kategorie einkaufen"
],
"عروض ومزايا": [
"Offers and benefits",
"Angebote und Vorteile"
],
"الكوبونات وأكواد الخصم": [
"Coupons and discount codes",
"Gutscheine und Rabattcodes"
],
"حسابك": [
"Your account",
"Ihr Konto"
],
"مساحتك": [
"Your space",
"Ihr Bereich"
],
"انضم إلينا": [
"Join us",
"Machen Sie mit"
],
"موقع التوصيل": [
"Delivery location",
"Lieferort"
],
"حدّد موقعك بدقة لنعرض لك مواعيد التوصيل الصحيحة ونملأ عنوان الشحن تلقائياً.": [
"Set your exact location so we can show accurate delivery times and fill in your shipping address automatically.",
"Legen Sie Ihren genauen Standort fest, damit wir korrekte Lieferzeiten anzeigen und die Lieferadresse automatisch ausfüllen."
],
"أو اختر مدينة سريعاً": [
"Or quickly pick a city",
"Oder wählen Sie schnell eine Stadt"
],
"تأكيد الموقع": [
"Confirm location",
"Standort bestätigen"
],
"ملابس وحقائب وإكسسوارات بتصاميم هادئة وخامات تدوم.": [
"Clothing, bags and accessories in calm designs and lasting materials.",
"Kleidung, Taschen und Accessoires in ruhigem Design und langlebigen Materialien."
],
"المتجر": [
"Store",
"Shop"
],
"العروض": [
"Offers",
"Angebote"
],
"انضم لينا": [
"Join us",
"Machen Sie mit"
],
"الشحن والإرجاع": [
"Shipping and returns",
"Versand und Rückgabe"
],
"شحن مجاني للطلبات فوق": [
"Free shipping on orders over",
"Kostenloser Versand bei Bestellungen ab"
],
"إرجاع مجاني خلال": [
"Free returns within",
"Kostenlose Rückgabe innerhalb von"
],
"يوماً": [
"days",
"Tagen"
],
"الدفع بالبطاقة أو عند الاستلام": [
"Pay by card or on delivery",
"Zahlung per Karte oder bei Lieferung"
],
"تواصل معنا": [
"Contact us",
"Kontaktieren Sie uns"
],
"يوميًا من {n} صباحاً حتى {n} مساءً": [
"Daily from {n} AM to {n} PM",
"Täglich von {n} bis {n} Uhr"
],
". جميع الحقوق محفوظة.": [
". All rights reserved.",
". Alle Rechte vorbehalten."
],
"جميع الحقوق محفوظة.": [
"All rights reserved.",
"Alle Rechte vorbehalten."
],
"السلة،": [
"Cart,",
"Warenkorb,"
],
"منتج": [
"item",
"Artikel"
],
"موقعك المحدّد": [
"Your selected location",
"Ihr gewählter Standort"
],
"مصر": [
"Egypt",
"Ägypten"
],
"حدّد موقعك على الخريطة أو اكتب مدينتك أولاً": [
"Set your location on the map or type your city first",
"Legen Sie zuerst Ihren Standort auf der Karte fest oder geben Sie Ihre Stadt ein"
],
"سيصلك طلبك إلى": [
"Your order will be delivered to",
"Ihre Bestellung wird geliefert an"
],
"تعذّر حفظ الموقع، حاول مرة أخرى.": [
"Couldn't save the location, please try again.",
"Standort konnte nicht gespeichert werden, bitte erneut versuchen."
],
"أُضيف «{n}» إلى السلة": [
"«{n}» added to cart",
"«{n}» zum Warenkorb hinzugefügt"
],
"أُضيف": [
"Added",
"Hinzugefügt"
],
"إلى المفضلة": [
"to favorites",
"zu den Favoriten"
],
"أُزيل": [
"Removed",
"Entfernt"
],
"من المفضلة": [
"from favorites",
"aus den Favoriten"
],
"تم حذف": [
"Removed",
"Entfernt"
],
"تخطّي إلى المحتوى": [
"Skip to content",
"Zum Inhalt springen"
],
"منتج واحد": [
"1 item",
"1 Artikel"
],
"منتجان": [
"2 items",
"2 Artikel"
],
"منتجات": [
"items",
"Artikel"
],
"منتجاً": [
"items",
"Artikel"
],
"أناقة هادئة،": [
"Calm elegance,",
"Ruhige Eleganz,"
],
"لكل يوم": [
"for every day",
"für jeden Tag"
],
"قطع مختارة بخامات تدوم موسماً بعد موسم.": [
"Selected pieces in materials that last season after season.",
"Ausgewählte Stücke aus Materialien, die Saison für Saison halten."
],
"شحن مجاني": [
"Free shipping",
"Kostenloser Versand"
],
"فوق": [
"over",
"ab"
],
"خلال": [
"within",
"innerhalb von"
],
"الدفع عند": [
"Pay on",
"Zahlung bei"
],
"الاستلام": [
"delivery",
"Lieferung"
],
"لبياناتك": [
"for your data",
"für Ihre Daten"
],
"تسوّق المجموعة": [
"Shop the collection",
"Kollektion entdecken"
],
"قطع جديدة هذا الأسبوع بخامات وتصاميم هادئة.": [
"New pieces this week in calm materials and designs.",
"Neue Stücke diese Woche in ruhigen Materialien und Designs."
],
"تسوّق الجديد": [
"Shop new arrivals",
"Neuheiten entdecken"
],
"خصم حتى": [
"Up to",
"Bis zu"
],
"على قطع مختارة.": [
"off selected items.",
"Rabatt auf ausgewählte Artikel."
],
"% على قطع مختارة.": [
"% off selected items.",
"% Rabatt auf ausgewählte Artikel."
],
"% على قطع مختارة": [
"% off selected items",
"% Rabatt auf ausgewählte Artikel"
],
"شاهد العروض": [
"See offers",
"Angebote ansehen"
],
"حقائب ومحافظ جلد": [
"Leather bags and wallets",
"Ledertaschen und Geldbörsen"
],
"جلد طبيعي يزداد جمالاً مع الاستخدام.": [
"Natural leather that gets better with use.",
"Echtes Leder, das mit dem Gebrauch schöner wird."
],
"تسوّق الحقائب": [
"Shop bags",
"Taschen entdecken"
],
"إكسسوارات تكمل إطلالتك": [
"Accessories to complete your look",
"Accessoires, die Ihren Look vervollständigen"
],
"ساعات ونظارات وأوشحة بلمسة بسيطة.": [
"Watches, sunglasses and scarves with a simple touch.",
"Uhren, Sonnenbrillen und Schals mit schlichter Note."
],
"تسوّق الإكسسوارات": [
"Shop accessories",
"Accessoires entdecken"
],
"ملابس لكل يوم": [
"Clothing for every day",
"Kleidung für jeden Tag"
],
"هودي وجاكيت وتيشيرتات بقصّات مريحة.": [
"Hoodies, jackets and t-shirts in comfortable cuts.",
"Hoodies, Jacken und T-Shirts in bequemen Schnitten."
],
"تسوّق الملابس": [
"Shop clothing",
"Kleidung entdecken"
],
"حتى": [
"Up to",
"Bis zu"
],
"كل العروض": [
"All offers",
"Alle Angebote"
],
"خصومات حسب الفئة": [
"Discounts by category",
"Rabatte nach Kategorie"
],
"تسوّق بثقة من نَسَق": [
"Shop with confidence at Nasaq",
"Kaufen Sie mit Vertrauen bei Nasaq"
],
"أنشئ حسابك لإدارة طلباتك ومشترياتك في مكان واحد.": [
"Create your account to manage your orders and purchases in one place.",
"Erstellen Sie Ihr Konto, um Bestellungen und Einkäufe an einem Ort zu verwalten."
],
"إرجاع خلال": [
"Returns within",
"Rückgabe innerhalb von"
],
"ينتهي خلال": [
"Ends in",
"Endet in"
],
"تسوّق حسب الميزانية": [
"Shop by budget",
"Nach Budget einkaufen"
],
"ج.م فأقل": [
"EGP or less",
"EGP oder weniger"
],
"أقل من": [
"Under",
"Unter"
],
"ج.م": [
"EGP",
"EGP"
],
"تقييم)": [
"reviews)",
"Bewertungen)"
],
"جديد على نَسَق": [
"New on Nasaq",
"Neu bei Nasaq"
],
"انسخ كود الخصم": [
"Copy discount code",
"Rabattcode kopieren"
],
"أكواد الخصم": [
"Discount codes",
"Rabattcodes"
],
"انسخ الكود واستخدمه عند إتمام الطلب. أكواد الخصم تُطبَّق فوق أسعار العروض.": [
"Copy the code and use it at checkout. Discount codes apply on top of sale prices.",
"Kopieren Sie den Code und verwenden Sie ihn an der Kasse. Rabattcodes gelten zusätzlich zu den Angebotspreisen."
],
"لا توجد منتجات قريبة منك بعد": [
"No products near you yet",
"Noch keine Produkte in Ihrer Nähe"
],
"لم يضف أي متجر منتجات ضمن": [
"No store has added products within",
"Kein Shop hat Produkte hinzugefügt im Umkreis von"
],
"كم من موقعك حتى الآن. جرّب تغيير موقعك أو عد لاحقاً.": [
"km of your location yet. Try changing your location or come back later.",
"km Ihres Standorts. Ändern Sie Ihren Standort oder kommen Sie später wieder."
],
"تغيير الموقع": [
"Change location",
"Standort ändern"
],
"تم نسخ الكود": [
"Code copied",
"Code kopiert"
],
"أدخل بريداً إلكترونياً صحيحاً، مثل name@example.com": [
"Enter a valid email address, e.g. name@example.com",
"Geben Sie eine gültige E-Mail-Adresse ein, z. B. name@example.com"
],
"تم اشتراكك بنجاح، سنراسلك بأحدث القطع": [
"You're subscribed! We'll email you the latest arrivals",
"Abonniert! Wir senden Ihnen die neuesten Artikel"
],
"ألف": [
"K",
"Tsd."
],
"متبقي قطعة واحدة فقط": [
"Only 1 left",
"Nur noch 1 übrig"
],
"متبقي": [
"Only",
"Nur noch"
],
"قطع فقط": [
"left",
"übrig"
],
"توصيل مجاني": [
"Free delivery",
"Kostenlose Lieferung"
],
"توصيل خلال {n} - {n} أيام": [
"Delivery in {n} - {n} days",
"Lieferung in {n} - {n} Tagen"
],
"أضف إلى السلة:": [
"Add to cart:",
"In den Warenkorb:"
],
"كل ما تحتاجه في مكان واحد": [
"Everything you need in one place",
"Alles, was Sie brauchen, an einem Ort"
],
"إلكترونيات وأجهزة ومنزل وأزياء وجمال وأكثر": [
"Electronics, appliances, home, fashion, beauty and more",
"Elektronik, Geräte, Haushalt, Mode, Schönheit und mehr"
],
"ابدأ التسوّق": [
"Start shopping",
"Jetzt einkaufen"
],
"عروض لفترة محدودة في كل الأقسام": [
"Limited-time offers in every department",
"Zeitlich begrenzte Angebote in allen Bereichen"
],
"أحدث المنتجات في كل الأقسام": [
"Newest products in every department",
"Neueste Produkte in allen Bereichen"
],
"أجهزة تسهّل يومك": [
"Appliances that make your day easier",
"Geräte, die Ihren Tag erleichtern"
],
"ثلاجات وغسالات وتكييفات بتوصيل سريع": [
"Refrigerators, washers and air conditioners with fast delivery",
"Kühlschränke, Waschmaschinen und Klimaanlagen mit schneller Lieferung"
],
"تسوّق الأجهزة": [
"Shop appliances",
"Geräte entdecken"
],
"موضة تناسب الجميع": [
"Fashion for everyone",
"Mode für alle"
],
"ملابس وأحذية وحقائب لكل الأعمار": [
"Clothing, shoes and bags for all ages",
"Kleidung, Schuhe und Taschen für jedes Alter"
],
"تسوّق الأزياء": [
"Shop fashion",
"Mode entdecken"
],
"· الدفع عند الاستلام": [
"· Cash on delivery",
"· Zahlung bei Lieferung"
],
"لافتة": [
"Banner",
"Banner"
],
"استمتع بترفيه غير مسبوق": [
"Enjoy unprecedented entertainment",
"Genießen Sie beispiellose Unterhaltung"
],
"بيتك بأحلى شكل": [
"Your home at its best",
"Ihr Zuhause von seiner besten Seite"
],
"إطلالة جديدة لكل مناسبة": [
"A new look for every occasion",
"Ein neuer Look für jeden Anlass"
],
"خطوة مريحة كل يوم": [
"A comfortable step every day",
"Jeden Tag ein bequemer Schritt"
],
"حقيبة تناسب وجهتك": [
"A bag for your destination",
"Die passende Tasche für Ihr Ziel"
],
"لمسة تكمل إطلالتك": [
"A touch that completes your look",
"Das i-Tüpfelchen für Ihren Look"
],
"جمالك أولاً": [
"Your beauty first",
"Ihre Schönheit zuerst"
],
"مشتريات البيت في مكان واحد": [
"Home shopping in one place",
"Haushaltseinkäufe an einem Ort"
],
"فرحة الأطفال تبدأ هنا": [
"Kids' joy starts here",
"Kinderfreude beginnt hier"
],
"ابدأ نشاطك اليوم": [
"Start your activity today",
"Starten Sie heute Ihre Aktivität"
],
"للقراءة والدراسة": [
"For reading and studying",
"Zum Lesen und Lernen"
],
"عناية كاملة لسيارتك": [
"Complete care for your car",
"Rundum-Pflege für Ihr Auto"
],
"كل ما يحتاجه رفيقك": [
"Everything your companion needs",
"Alles, was Ihr Begleiter braucht"
],
"أدوات لكل مهمة": [
"Tools for every job",
"Werkzeug für jede Aufgabe"
],
"اكتشف": [
"Discover",
"Entdecken"
],
"مختارات": [
"Picks",
"Auswahl"
],
"مقترحة لك": [
"Suggested for you",
"Für Sie empfohlen"
],
"تسوّق حسب القسم": [
"Shop by department",
"Nach Abteilung einkaufen"
],
"لا توجد منتجات": [
"No products",
"Keine Produkte"
],
"قائمة المفضلة": [
"Favorites list",
"Favoritenliste"
],
"نتائج البحث عن «{n}»": [
"Search results for «{n}»",
"Suchergebnisse für «{n}»"
],
"نتائج البحث عن": [
"Search results for",
"Suchergebnisse für"
],
"إزالة الفلتر:": [
"Remove filter:",
"Filter entfernen:"
],
"بحث:": [
"Search:",
"Suche:"
],
"السعر:": [
"Price:",
"Preis:"
],
"قائمة المفضلة فارغة": [
"Your favorites list is empty",
"Ihre Favoritenliste ist leer"
],
"اضغط على القلب في أي منتج لتحفظه هنا وتعود إليه لاحقاً.": [
"Tap the heart on any product to save it here and come back to it later.",
"Tippen Sie bei einem Produkt auf das Herz, um es hier zu speichern und später darauf zurückzukommen."
],
"لا توجد نتائج مطابقة": [
"No matching results",
"Keine passenden Ergebnisse"
],
"جرّب كلمات أبسط، أو وسّع نطاق السعر، أو أزل بعض الفلاتر.": [
"Try simpler words, widen the price range, or remove some filters.",
"Versuchen Sie einfachere Begriffe, erweitern Sie den Preisbereich oder entfernen Sie einige Filter."
],
"المنتج غير موجود |": [
"Product not found |",
"Produkt nicht gefunden |"
],
"المنتج غير موجود": [
"Product not found",
"Produkt nicht gefunden"
],
"لم نجد هذا المنتج": [
"We couldn't find this product",
"Wir haben dieses Produkt nicht gefunden"
],
"ربما تغيّر الرابط أو لم يعد المنتج متاحاً. تصفّح بقية القطع من المتجر.": [
"The link may have changed or the product is no longer available. Browse the rest of the store.",
"Der Link hat sich möglicherweise geändert oder das Produkt ist nicht mehr verfügbar. Stöbern Sie im restlichen Shop."
],
"تصفّح المتجر": [
"Browse the store",
"Shop durchstöbern"
],
"عرض كل الصور،": [
"View all photos,",
"Alle Fotos anzeigen,"
],
"صور": [
"photos",
"Fotos"
],
"عرض الصورة": [
"View image",
"Bild anzeigen"
],
"تشغيل فيديو المنتج": [
"Play product video",
"Produktvideo abspielen"
],
"بالشحن السريع": [
"with express shipping",
"mit Expressversand"
],
"نفدت الكمية حالياً": [
"Currently out of stock",
"Derzeit ausverkauft"
],
"متوفر في المخزون": [
"In stock",
"Auf Lager"
],
"غير متوفر": [
"Unavailable",
"Nicht verfügbar"
],
"معرض صور": [
"Photo gallery",
"Fotogalerie"
],
"الصورة": [
"Image",
"Bild"
],
"الصورة السابقة": [
"Previous image",
"Vorheriges Bild"
],
"الصورة التالية": [
"Next image",
"Nächstes Bild"
],
"اضغط لعرض الصورة بالحجم الكامل": [
"Click to view the image in full size",
"Klicken, um das Bild in voller Größe anzuzeigen"
],
"· البائع:": [
"· Seller:",
"· Verkäufer:"
],
"البائع": [
"Seller",
"Verkäufer"
],
"وفّر": [
"Save",
"Sparen Sie"
],
"دفع آمن وحماية للمشتري": [
"Secure payment and buyer protection",
"Sichere Zahlung und Käuferschutz"
],
"المواصفات": [
"Specifications",
"Spezifikationen"
],
"رمز المنتج:": [
"Product code:",
"Produktcode:"
],
"يصل الطلب خلال {n} إلى {n} أيام عمل، أو {n} إلى {n} يوم بالشحن السريع. يمكنك إرجاع القطعة خلال": [
"Your order arrives within {n} to {n} business days, or {n} to {n} days with express shipping. You can return the item within",
"Ihre Bestellung kommt innerhalb von {n} bis {n} Werktagen an, oder {n} bis {n} Tagen mit Expressversand. Sie können den Artikel innerhalb von"
],
"يوماً بحالتها الأصلية وسنعيد لك المبلغ كاملاً.": [
"days in its original condition and we'll refund you in full.",
"Tagen im Originalzustand zurücksenden und wir erstatten den vollen Betrag."
],
"إلى المجموعة": [
"to the bundle",
"zum Set"
],
"هذا المنتج:": [
"This item:",
"Dieser Artikel:"
],
"المقاس واللون من اختياراتك أعلاه": [
"Size and color from your selections above",
"Größe und Farbe aus Ihrer Auswahl oben"
],
"يُشترى معاً بشكل متكرر": [
"Frequently bought together",
"Wird oft zusammen gekauft"
],
"الإجمالي:": [
"Total:",
"Gesamt:"
],
"أضف المنتج إلى السلة": [
"Add the product to cart",
"Produkt in den Warenkorb legen"
],
"منتجات إلى السلة": [
"items to cart",
"Artikel in den Warenkorb"
],
"اختر منتجاً واحداً على الأقل": [
"Select at least one product",
"Wählen Sie mindestens ein Produkt"
],
"اختر مقاس هذا المنتج من الأعلى أولاً": [
"Choose this product's size above first",
"Wählen Sie zuerst oben die Größe dieses Produkts"
],
"عملاء شاهدوا هذا المنتج شاهدوا أيضاً": [
"Customers who viewed this also viewed",
"Kunden, die dies ansahen, sahen auch"
],
"بالحجم الكامل": [
"in full size",
"in voller Größe"
],
"يرجى اختيار المقاس أولاً": [
"Please choose a size first",
"Bitte wählen Sie zuerst eine Größe"
],
"خصم {n}%": [
"{n}% off",
"{n}% Rabatt"
],
"خصم {n}": [
"{n} off",
"{n} Rabatt"
],
"على الطلبات فوق {n}": [
"on orders over {n}",
"bei Bestellungen über {n}"
],
"يتطلب الكوبون طلباً بقيمة": [
"This coupon requires an order of",
"Dieser Gutschein erfordert eine Bestellung von"
],
"على الأقل": [
"at least",
"mindestens"
],
"نفدت كمية هذا المنتج": [
"This product is out of stock",
"Dieses Produkt ist ausverkauft"
],
"هذا المقاس غير متوفر حالياً": [
"This size is currently unavailable",
"Diese Größe ist derzeit nicht verfügbar"
],
"وصلت إلى أقصى كمية متاحة من هذا المنتج (": [
"You've reached the maximum available quantity of this product (",
"Sie haben die maximal verfügbare Menge dieses Produkts erreicht ("
],
"المنتج غير موجود في السلة": [
"The product is not in the cart",
"Das Produkt befindet sich nicht im Warenkorb"
],
"الكمية المتاحة من هذا المنتج": [
"The available quantity of this product",
"Die verfügbare Menge dieses Produkts"
],
"فقط": [
"only",
"nur"
],
"أدخل كود الخصم أولاً": [
"Enter a discount code first",
"Geben Sie zuerst einen Rabattcode ein"
],
"كود الخصم غير صحيح أو منتهي": [
"The discount code is invalid or expired",
"Der Rabattcode ist ungültig oder abgelaufen"
],
"أضف منتجات إلى السلة قبل تطبيق الكوبون": [
"Add products to the cart before applying the coupon",
"Legen Sie Produkte in den Warenkorb, bevor Sie den Gutschein einlösen"
],
"تم تطبيق الكوبون:": [
"Coupon applied:",
"Gutschein angewendet:"
],
"لم تضف أي منتج بعد. اكتشف أحدث القطع وأضف ما يعجبك.": [
"You haven't added any product yet. Discover the latest items and add what you like.",
"Sie haben noch kein Produkt hinzugefügt. Entdecken Sie die neuesten Artikel und fügen Sie hinzu, was Ihnen gefällt."
],
"ابدأ التسوق": [
"Start shopping",
"Jetzt einkaufen"
],
"الأكثر تقييماً": [
"Top rated",
"Am besten bewertet"
],
"المنتجات في السلة": [
"Products in cart",
"Produkte im Warenkorb"
],
"متابعة التسوق": [
"Continue shopping",
"Weiter einkaufen"
],
"إفراغ السلة": [
"Empty cart",
"Warenkorb leeren"
],
"تم إفراغ السلة": [
"Cart emptied",
"Warenkorb geleert"
],
"اضغط للتأكيد": [
"Tap to confirm",
"Zum Bestätigen tippen"
],
"لا توجد منتجات لإتمام الطلب": [
"No products to check out",
"Keine Produkte zur Bestellung"
],
"سلتك فارغة حالياً. أضف بعض القطع ثم عد لإكمال الشراء.": [
"Your cart is currently empty. Add some items, then come back to finish your purchase.",
"Ihr Warenkorb ist derzeit leer. Fügen Sie Artikel hinzu und kehren Sie dann zurück, um den Kauf abzuschließen."
],
"أدخل اسمك الكامل ({n} أحرف على الأقل)": [
"Enter your full name (at least {n} characters)",
"Geben Sie Ihren vollständigen Namen ein (mindestens {n} Zeichen)"
],
"أدخل رقم جوال يحتوي على أرقام فقط": [
"Enter a mobile number containing digits only",
"Geben Sie eine Handynummer nur mit Ziffern ein"
],
"رقم الجوال يجب أن يكون بين {n} و{n} رقماً": [
"The mobile number must be between {n} and {n} digits",
"Die Handynummer muss zwischen {n} und {n} Ziffern lang sein"
],
"أدخل العنوان بالتفصيل (الحي، الشارع، رقم المبنى)": [
"Enter the full address (district, street, building number)",
"Geben Sie die vollständige Adresse ein (Viertel, Straße, Hausnummer)"
],
"أدخل اسم المدينة": [
"Enter the city name",
"Geben Sie den Städtenamen ein"
],
"الرمز البريدي غير صحيح": [
"The postal code is invalid",
"Die Postleitzahl ist ungültig"
],
"رقم البطاقة يجب أن يكون بين {n} و{n} رقماً": [
"The card number must be between {n} and {n} digits",
"Die Kartennummer muss zwischen {n} und {n} Ziffern lang sein"
],
"رقم البطاقة غير صحيح، راجع الأرقام": [
"The card number is invalid, please check the digits",
"Die Kartennummer ist ungültig, bitte prüfen Sie die Ziffern"
],
"أدخل الاسم كما هو مكتوب على البطاقة": [
"Enter the name as written on the card",
"Geben Sie den Namen wie auf der Karte ein"
],
"أدخل تاريخ الانتهاء بصيغة MM/YY": [
"Enter the expiry date as MM/YY",
"Geben Sie das Ablaufdatum als MM/JJ ein"
],
"الشهر يجب أن يكون بين {n} و{n}": [
"The month must be between {n} and {n}",
"Der Monat muss zwischen {n} und {n} liegen"
],
"البطاقة منتهية الصلاحية": [
"The card has expired",
"Die Karte ist abgelaufen"
],
"رمز CVV مكوّن من {n} أو {n} أرقام": [
"The CVV code has {n} or {n} digits",
"Der CVV-Code besteht aus {n} oder {n} Ziffern"
],
"يجب الموافقة على الشروط لإتمام الطلب": [
"You must accept the terms to complete the order",
"Sie müssen den Bedingungen zustimmen, um die Bestellung abzuschließen"
],
"يرجى تصحيح": [
"Please correct",
"Bitte korrigieren Sie"
],
"حقل": [
"field",
"Feld"
],
"حقول": [
"fields",
"Felder"
],
"قبل المتابعة:": [
"before continuing:",
"bevor Sie fortfahren:"
],
"الشروط": [
"Terms",
"Bedingungen"
],
"جارٍ إتمام الطلب…": [
"Placing your order…",
"Bestellung wird abgeschlossen…"
],
"تم استلام طلبك |": [
"Order received |",
"Bestellung erhalten |"
],
"تم استلام طلبك": [
"Your order has been received",
"Ihre Bestellung ist eingegangen"
],
"شكراً": [
"Thank you",
"Vielen Dank"
],
"، تم استلام طلبك": [
", your order has been received",
", Ihre Bestellung ist eingegangen"
],
"أرسلنا تفاصيل الطلب إلى": [
"We sent the order details to",
"Wir haben die Bestelldetails gesendet an"
],
"عدد القطع": [
"Number of items",
"Anzahl der Artikel"
],
"موعد الوصول المتوقع": [
"Estimated arrival",
"Voraussichtliche Ankunft"
],
"لم نعثر على هذا المتجر": [
"We couldn't find this store",
"Wir haben diesen Shop nicht gefunden"
],
"ربما تغيّر رابط المتجر أو لم يعد متاحاً.": [
"The store link may have changed or it's no longer available.",
"Der Shop-Link hat sich möglicherweise geändert oder der Shop ist nicht mehr verfügbar."
],
"هذا المتجر خارج نطاق التوصيل عندك": [
"This store is outside your delivery range",
"Dieser Shop liegt außerhalb Ihres Liefergebiets"
],
"نعرض فقط المتاجر التي تبعد عنك": [
"We only show stores within",
"Wir zeigen nur Shops im Umkreis von"
],
"كم أو أقل، وهذا المتجر أبعد من ذلك.": [
"km or less, and this store is farther away.",
"km oder weniger, und dieser Shop ist weiter entfernt."
],
"تصفّح المتاجر القريبة منك": [
"Browse stores near you",
"Shops in Ihrer Nähe durchstöbern"
],
"منتج · الإرجاع خلال {n} يوماً": [
"items · Returns within {n} days",
"Artikel · Rückgabe innerhalb von {n} Tagen"
],
"· يبعد عنك": [
"· away from you",
"· von Ihnen entfernt"
],
"لا توجد منتجات منشورة بعد": [
"No products published yet",
"Noch keine Produkte veröffentlicht"
],
"سيظهر هنا كل ما ينشره هذا المتجر.": [
"Everything this store publishes will appear here.",
"Alles, was dieser Shop veröffentlicht, erscheint hier."
],
"تصفّح كل المنتجات": [
"Browse all products",
"Alle Produkte durchstöbern"
],
"القاهرة": [
"Cairo",
"Kairo"
],
"الجيزة": [
"Giza",
"Gizeh"
],
"الإسكندرية": [
"Alexandria",
"Alexandria"
],
"المنصورة": [
"Mansoura",
"Mansura"
],
"طنطا": [
"Tanta",
"Tanta"
],
"الزقازيق": [
"Zagazig",
"Zagazig"
],
"أسيوط": [
"Asyut",
"Assiut"
],
"الأقصر": [
"Luxor",
"Luxor"
],
"لافتة الصفحة الرئيسية": [
"Home page banner",
"Banner auf der Startseite"
],
"تظهر ضمن شريط اللافتات في أول الرئيسية، أعلى ظهور في المتجر.": [
"Appears in the banner strip at the top of the home page — the highest visibility in the store.",
"Erscheint im Bannerstreifen oben auf der Startseite – die höchste Sichtbarkeit im Shop."
],
"لافتة أعلى صفحة المنتجات": [
"Products page top banner",
"Banner oben auf der Produktseite"
],
"شريط عريض أعلى نتائج التصفح، يمكن تخصيصه لفئة معيّنة أو كل الفئات.": [
"A wide strip above the browsing results, which can target one category or all categories.",
"Ein breiter Streifen über den Suchergebnissen, der einer Kategorie oder allen Kategorien zugewiesen werden kann."
],
"منتج مموَّل": [
"Sponsored product",
"Gesponsertes Produkt"
],
"يظهر منتجك أولاً في القوائم والكاروسيل بشارة «مموّل».": [
"Your product appears first in lists and carousels with a \"Sponsored\" badge.",
"Ihr Produkt erscheint zuerst in Listen und Karussells mit dem Etikett „Gesponsert“."
],
"أساسي": [
"Basic",
"Standard"
],
"عميل": [
"Customer",
"Kunde"
],
"بائع شريك": [
"Partner seller",
"Partnerverkäufer"
],
"مندوب توصيل": [
"Delivery courier",
"Lieferkurier"
],
"مشرف نَسَق": [
"Nasaq supervisor",
"Nasaq-Supervisor"
],
"أدر متجرك ومنتجاتك وطلباتك": [
"Manage your store, products and orders",
"Verwalten Sie Ihren Shop, Ihre Produkte und Bestellungen"
],
"تابع التوصيلات والأرباح اليومية": [
"Track deliveries and daily earnings",
"Verfolgen Sie Lieferungen und tägliche Einnahmen"
],
"شغّل السوق وتابع الدعم والطلبات": [
"Run the marketplace and follow support and orders",
"Steuern Sie den Marktplatz und verfolgen Sie Support und Bestellungen"
],
"رد على محادثات العملاء حسب نطاقك": [
"Reply to customer chats within your scope",
"Beantworten Sie Kundenchats in Ihrem Bereich"
],
"ابدأ البيع معنا": [
"Start selling with us",
"Beginnen Sie bei uns zu verkaufen"
],
"حوّل منتجاتك إلى متجر على نَسَق": [
"Turn your products into a store on Nasaq",
"Machen Sie Ihre Produkte zu einem Shop auf Nasaq"
],
"قيد المعالجة": [
"Processing",
"In Bearbeitung"
],
"تم الشحن": [
"Shipped",
"Versendet"
],
"مكتمل": [
"Completed",
"Abgeschlossen"
],
"ملغي": [
"Cancelled",
"Storniert"
],
"لا توجد طلبات محفوظة بعد.": [
"No saved orders yet.",
"Noch keine gespeicherten Bestellungen."
],
"قطعة": [
"pcs",
"Stk."
],
"حسابك في نَسَق": [
"Your Nasaq account",
"Ihr Nasaq-Konto"
],
"سجّل الدخول لمتابعة طلباتك ومفضلاتك وإدارة مساحتك.": [
"Log in to track your orders and favorites and manage your space.",
"Melden Sie sich an, um Ihre Bestellungen und Favoriten zu verfolgen und Ihren Bereich zu verwalten."
],
"إنشاء حساب": [
"Create account",
"Konto erstellen"
],
"عميل نَسَق": [
"Nasaq customer",
"Nasaq-Kunde"
],
"تعذّر تحميل طلباتك الآن.": [
"Couldn't load your orders right now.",
"Ihre Bestellungen konnten gerade nicht geladen werden."
],
"أعد المحاولة": [
"Try again",
"Erneut versuchen"
],
"لم تحدّد موقعك بعد.": [
"You haven't set your location yet.",
"Sie haben Ihren Standort noch nicht festgelegt."
],
"مرحباً بك في نَسَق": [
"Welcome to Nasaq",
"Willkommen bei Nasaq"
],
"بيانات الحساب": [
"Account details",
"Kontodaten"
],
"عدّل بياناتك وستظهر في حسابك وكل طلباتك القادمة.": [
"Edit your details and they'll appear in your account and all your future orders.",
"Bearbeiten Sie Ihre Daten; sie erscheinen in Ihrem Konto und in allen künftigen Bestellungen."
],
"الاسم": [
"Name",
"Name"
],
"حفظ البيانات": [
"Save details",
"Daten speichern"
],
"تعديل الموقع": [
"Edit location",
"Standort bearbeiten"
],
"تحديد الموقع": [
"Set location",
"Standort festlegen"
],
"حفظ الموقع": [
"Save location",
"Standort speichern"
],
"مساحتك في نَسَق": [
"Your space on Nasaq",
"Ihr Bereich bei Nasaq"
],
"الوصول السريع للأدوات المناسبة لدورك.": [
"Quick access to the tools for your role.",
"Schneller Zugriff auf die Werkzeuge für Ihre Rolle."
],
"قدّم طلبك وابدأ رحلتك مع نَسَق": [
"Submit your application and start your journey with Nasaq",
"Reichen Sie Ihre Bewerbung ein und beginnen Sie Ihre Reise mit Nasaq"
],
"الدعم والمساعدة": [
"Support and help",
"Support und Hilfe"
],
"ابدأ محادثة مع فريق الدعم أو تابع محادثاتك": [
"Start a chat with the support team or follow your conversations",
"Starten Sie einen Chat mit dem Support-Team oder verfolgen Sie Ihre Unterhaltungen"
],
"طلباتك": [
"Your orders",
"Ihre Bestellungen"
],
"آخر الطلبات المرتبطة بحسابك، محدّثة مباشرة من قاعدة البيانات.": [
"Latest orders linked to your account, updated live from the database.",
"Neueste Bestellungen Ihres Kontos, live aus der Datenbank aktualisiert."
],
"جارٍ حفظ البيانات…": [
"Saving details…",
"Daten werden gespeichert…"
],
"تم حفظ بياناتك بنجاح.": [
"Your details were saved successfully.",
"Ihre Daten wurden erfolgreich gespeichert."
],
"تعذّر حفظ البيانات.": [
"Couldn't save the details.",
"Die Daten konnten nicht gespeichert werden."
],
"من فضلك حدّد موقعك على الخريطة أولاً.": [
"Please set your location on the map first.",
"Bitte legen Sie zuerst Ihren Standort auf der Karte fest."
],
"جارٍ حفظ الموقع…": [
"Saving location…",
"Standort wird gespeichert…"
],
"تعذّر حفظ الموقع.": [
"Couldn't save the location.",
"Der Standort konnte nicht gespeichert werden."
],
"إحداثيات الموقع غير صحيحة.": [
"The location coordinates are invalid.",
"Die Standortkoordinaten sind ungültig."
],
"الخدمة متاحة داخل مصر فقط.": [
"The service is available inside Egypt only.",
"Der Service ist nur innerhalb Ägyptens verfügbar."
],
"تعذّر الاتصال بالخادم لحفظ الموقع.": [
"Couldn't reach the server to save the location.",
"Server zum Speichern des Standorts nicht erreichbar."
],
"أداة تحديد الموقع غير متاحة الآن.": [
"The location tool isn't available right now.",
"Das Standort-Tool ist derzeit nicht verfügbar."
],
"عروض اليوم بانتظارك": [
"Today's deals are waiting for you",
"Die Angebote des Tages warten auf Sie"
],
"قطع جديدة وخصومات مختارة أُضيفت الآن — تصفّحها قبل ما تخلص.": [
"New items and selected discounts were just added — browse them before they sell out.",
"Neue Artikel und ausgewählte Rabatte wurden gerade hinzugefügt – stöbern Sie, bevor sie weg sind."
],
"الآن": [
"Now",
"Jetzt"
],
"تخطي": [
"Skip",
"Überspringen"
],
"المشتري": [
"Buyer",
"Käufer"
],
"السائق": [
"Driver",
"Fahrer"
],
"بيانات الدخول غير صحيحة.": [
"The login details are incorrect.",
"Die Anmeldedaten sind falsch."
],
"من فضلك حدّد موقعك على الخريطة (بالضغط عليها، بالبحث عن عنوان، أو بزر \"استخدم موقعي الحالي\") قبل إنشاء الحساب.": [
"Please set your location on the map (by tapping it, searching for an address, or using the \"Use my current location\" button) before creating the account.",
"Bitte legen Sie Ihren Standort auf der Karte fest (durch Tippen, Adresssuche oder die Schaltfläche „Meinen aktuellen Standort verwenden“), bevor Sie das Konto erstellen."
],
"تعذّر إنشاء الحساب.": [
"Couldn't create the account.",
"Das Konto konnte nicht erstellt werden."
],
"كلمتا المرور غير متطابقتين": [
"The passwords don't match",
"Die Passwörter stimmen nicht überein"
],
"تعذّر الاتصال بالخادم.": [
"Couldn't reach the server.",
"Server nicht erreichbar."
],
"حدّد موقع متجرك على الخريطة قبل إرسال الطلب.": [
"Set your store location on the map before submitting the request.",
"Legen Sie den Standort Ihres Shops auf der Karte fest, bevor Sie die Anfrage senden."
],
"تاجر / صاحب محل": [
"Merchant / shop owner",
"Händler / Ladenbesitzer"
],
"تعذّر إرسال الطلب، حاول مرة أخرى.": [
"Couldn't send the request, please try again.",
"Die Anfrage konnte nicht gesendet werden, bitte erneut versuchen."
],
"حساب جديد": [
"New account",
"Neues Konto"
],
"منذ": [
"ago",
"vor"
],
"دقيقة": [
"minute",
"Minute"
],
"إرسال الرمز عبر واتساب": [
"Send the code via WhatsApp",
"Code per WhatsApp senden"
],
"تم إرسال رمز جديد عبر واتساب": [
"A new code was sent via WhatsApp",
"Ein neuer Code wurde per WhatsApp gesendet"
],
"من فضلك أدخل الرمز كاملاً": [
"Please enter the full code",
"Bitte geben Sie den vollständigen Code ein"
],
"الخدمة متاحة داخل مصر فقط. اختر موقعاً داخل مصر.": [
"The service is available inside Egypt only. Choose a location inside Egypt.",
"Der Service ist nur innerhalb Ägyptens verfügbar. Wählen Sie einen Standort in Ägypten."
],
"متصفحك لا يدعم تحديد الموقع، ابحث عن عنوانك يدوياً.": [
"Your browser doesn't support geolocation — search for your address manually.",
"Ihr Browser unterstützt keine Standortbestimmung – suchen Sie Ihre Adresse manuell."
],
"تحديد الموقع يعمل فقط على اتصال آمن (https). ابحث عن عنوانك يدوياً.": [
"Geolocation only works on a secure connection (https). Search for your address manually.",
"Die Standortbestimmung funktioniert nur über eine sichere Verbindung (https). Suchen Sie Ihre Adresse manuell."
],
"موقعك الحالي خارج مصر. الخدمة متاحة داخل مصر فقط، اختر عنواناً داخل مصر.": [
"Your current location is outside Egypt. The service is available inside Egypt only — choose an address inside Egypt.",
"Ihr aktueller Standort liegt außerhalb Ägyptens. Der Service ist nur in Ägypten verfügbar – wählen Sie eine Adresse in Ägypten."
],
"تم رفض إذن الموقع. فعّله من إعدادات المتصفح أو ابحث عن عنوانك.": [
"Location permission was denied. Enable it in your browser settings or search for your address.",
"Der Standortzugriff wurde verweigert. Aktivieren Sie ihn in den Browsereinstellungen oder suchen Sie Ihre Adresse."
],
"انتهت مهلة تحديد الموقع، حاول مرة أخرى.": [
"Locating timed out, please try again.",
"Zeitüberschreitung bei der Standortbestimmung, bitte erneut versuchen."
],
"تعذّر تحديد موقعك الآن، حاول لاحقاً أو ابحث عن عنوانك.": [
"Couldn't determine your location now — try later or search for your address.",
"Standort konnte nicht ermittelt werden – versuchen Sie es später oder suchen Sie Ihre Adresse."
],
"متصفحك لا يدعم تحديد الموقع.": [
"Your browser doesn't support geolocation.",
"Ihr Browser unterstützt keine Standortbestimmung."
],
"تحديد الموقع يعمل فقط على اتصال آمن (https).": [
"Geolocation only works on a secure connection (https).",
"Die Standortbestimmung funktioniert nur über eine sichere Verbindung (https)."
],
"تم رفض إذن الموقع. فعّله من إعدادات المتصفح ليتم تحديث موقعك.": [
"Location permission was denied. Enable it in your browser settings to update your location.",
"Der Standortzugriff wurde verweigert. Aktivieren Sie ihn in den Browsereinstellungen, um Ihren Standort zu aktualisieren."
],
"خدمة العناوين غير متاحة الآن": [
"The address service isn't available right now",
"Der Adressdienst ist derzeit nicht verfügbar"
],
"خدمة البحث غير متاحة الآن": [
"The search service isn't available right now",
"Der Suchdienst ist derzeit nicht verfügbar"
],
"الحي / المنطقة": [
"District / area",
"Viertel / Gebiet"
],
"الشارع": [
"Street",
"Straße"
],
"رقم المبنى / علامة مميزة": [
"Building number / landmark",
"Hausnummer / Wahrzeichen"
],
"المحافظة / الولاية": [
"Governorate / state",
"Gouvernement / Bundesland"
],
"ابحث عن عنوان": [
"Search for an address",
"Adresse suchen"
],
"ابحث عن عنوان أو حي أو معلم…": [
"Search for an address, district or landmark…",
"Nach Adresse, Viertel oder Sehenswürdigkeit suchen…"
],
"اضغط «استخدم موقعي الحالي» أو ابحث عن عنوانك لعرض الخريطة.": [
"Tap \"Use my current location\" or search for your address to show the map.",
"Tippen Sie auf „Meinen aktuellen Standort verwenden“ oder suchen Sie Ihre Adresse, um die Karte anzuzeigen."
],
"افتح في خرائط جوجل": [
"Open in Google Maps",
"In Google Maps öffnen"
],
"الخريطة: Google Maps (تفاعلية)": [
"Map: Google Maps (interactive)",
"Karte: Google Maps (interaktiv)"
],
"الخريطة: OpenStreetMap — التوصيل داخل مصر فقط. اسحب الدبوس أو اضغط على الخريطة لتحديد موقعك.": [
"Map: OpenStreetMap — delivery inside Egypt only. Drag the pin or tap the map to set your location.",
"Karte: OpenStreetMap – Lieferung nur innerhalb Ägyptens. Ziehen Sie den Pin oder tippen Sie auf die Karte, um Ihren Standort festzulegen."
],
"خريطة الموقع المحدد": [
"Selected location map",
"Karte des gewählten Standorts"
],
"جارٍ جلب تفاصيل العنوان…": [
"Fetching address details…",
"Adressdetails werden abgerufen…"
],
"تم تحديد العنوان. راجع التفاصيل وعدّلها إن لزم.": [
"Address set. Review the details and edit them if needed.",
"Adresse festgelegt. Prüfen Sie die Details und bearbeiten Sie sie bei Bedarf."
],
"تعذّر جلب تفاصيل العنوان تلقائياً. اكتب التفاصيل يدوياً.": [
"Couldn't fetch the address details automatically. Type the details manually.",
"Adressdetails konnten nicht automatisch abgerufen werden. Geben Sie sie manuell ein."
],
"اكتب {n} أحرف على الأقل للبحث.": [
"Type at least {n} characters to search.",
"Geben Sie mindestens {n} Zeichen für die Suche ein."
],
"جارٍ البحث…": [
"Searching…",
"Suche läuft…"
],
"لم نجد هذا العنوان. جرّب كتابته بشكل مختلف.": [
"We couldn't find this address. Try writing it differently.",
"Wir haben diese Adresse nicht gefunden. Versuchen Sie eine andere Schreibweise."
],
"اختر العنوان الصحيح من النتائج:": [
"Choose the correct address from the results:",
"Wählen Sie die richtige Adresse aus den Ergebnissen:"
],
"تعذّر البحث الآن، حاول لاحقاً.": [
"Search isn't possible right now, please try later.",
"Suche derzeit nicht möglich, bitte später erneut versuchen."
],
"مفتاح Google Maps غير صالح، نعرض المعاينة العادية.": [
"The Google Maps key is invalid, showing the standard preview.",
"Der Google-Maps-Schlüssel ist ungültig, die Standardvorschau wird angezeigt."
],
"تعذّر تحميل خرائط جوجل، نعرض المعاينة العادية.": [
"Couldn't load Google Maps, showing the standard preview.",
"Google Maps konnte nicht geladen werden, die Standardvorschau wird angezeigt."
],
"متر": [
"m",
"m"
],
"كم": [
"km",
"km"
],
"مفتوحة": [
"Open",
"Offen"
],
"قيد المتابعة": [
"In progress",
"In Bearbeitung"
],
"تم الحل": [
"Resolved",
"Gelöst"
],
"مقفولة": [
"Closed",
"Geschlossen"
],
"محادثة جديدة": [
"New chat",
"Neuer Chat"
],
"عنوان المشكلة": [
"Issue title",
"Titel des Problems"
],
"اشرح مشكلتك...": [
"Describe your problem...",
"Beschreiben Sie Ihr Problem..."
],
"إرسال للدعم": [
"Send to support",
"An den Support senden"
],
"استفسار": [
"Inquiry",
"Anfrage"
],
"رجوع": [
"Back",
"Zurück"
],
"إعادة فتح": [
"Reopen",
"Wieder öffnen"
],
"الدعم": [
"Support",
"Support"
],
"أنت": [
"You",
"Sie"
],
"المحادثة مقفولة": [
"The chat is closed",
"Der Chat ist geschlossen"
],
"إرسال": [
"Send",
"Senden"
],
"إغلاق المحادثة؟": [
"Close the chat?",
"Chat schließen?"
],
"لا توجد محادثات. ابدأ محادثة جديدة مع الدعم.": [
"No chats. Start a new chat with support.",
"Keine Chats. Starten Sie einen neuen Chat mit dem Support."
],
"إرفاق صورة": [
"Attach an image",
"Bild anhängen"
],
"اكتب رسالتك...": [
"Type your message...",
"Nachricht eingeben..."
],
"اكتب ردك...": [
"Type your reply...",
"Antwort eingeben..."
],
"إغلاق المحادثة": [
"Close chat",
"Chat schließen"
],
"تم الحفظ": [
"Saved",
"Gespeichert"
],
"مقبول": [
"Accepted",
"Akzeptiert"
],
"قيد التجهيز": [
"Being prepared",
"In Vorbereitung"
],
"جاهز للتوصيل": [
"Ready for delivery",
"Bereit zur Lieferung"
],
"مع المندوب": [
"With the courier",
"Beim Kurier"
],
"تم التسليم": [
"Delivered",
"Zugestellt"
],
"مرتجع": [
"Returned",
"Retourniert"
],
"تم إنشاء الطلب": [
"Order created",
"Bestellung erstellt"
],
"تم قبول الطلب": [
"Order accepted",
"Bestellung akzeptiert"
],
"جاري التجهيز": [
"Preparing",
"Wird vorbereitet"
],
"جديدة": [
"New",
"Neu"
],
"مقبولة": [
"Accepted",
"Akzeptiert"
],
"جاهزة": [
"Ready",
"Bereit"
],
"مسلَّمة": [
"Delivered",
"Zugestellt"
],
"ملغاة": [
"Cancelled",
"Storniert"
],
"حالة الطلب": [
"Order status",
"Bestellstatus"
],
"رقم الطلب": [
"Order number",
"Bestellnummer"
],
"التاريخ": [
"Date",
"Datum"
],
"الخصم": [
"Discount",
"Rabatt"
],
"الدفع": [
"Payment",
"Zahlung"
],
"حالة الدفع": [
"Payment status",
"Zahlungsstatus"
],
"عند الاستلام": [
"On delivery",
"Bei Lieferung"
],
"بانتظار التحصيل": [
"Awaiting collection",
"Zahlung ausstehend"
],
"مدفوع": [
"Paid",
"Bezahlt"
],
"مُسترجَع": [
"Refunded",
"Erstattet"
],
"فشل التحصيل": [
"Payment failed",
"Zahlung fehlgeschlagen"
],
"كل الطلبات": [
"All orders",
"Alle Bestellungen"
],
"اسم المنتج *": [
"Product name *",
"Produktname *"
],
"وصف المنتج (احترافي)": [
"Product description (professional)",
"Produktbeschreibung (professionell)"
],
"التصنيف": [
"Category",
"Kategorie"
],
"التصنيف *": [
"Category *",
"Kategorie *"
],
"المنتج": [
"Product",
"Produkt"
],
"المنتجات": [
"Products",
"Produkte"
],
"المخزون": [
"Stock",
"Bestand"
],
"الحالة": [
"Status",
"Status"
],
"إجراءات": [
"Actions",
"Aktionen"
],
"نشط": [
"Active",
"Aktiv"
],
"متوقف": [
"Paused",
"Pausiert"
],
"نفد": [
"Sold out",
"Ausverkauft"
],
"مخزون منخفض": [
"Low stock",
"Niedriger Bestand"
],
"إضافة منتج": [
"Add product",
"Produkt hinzufügen"
],
"تعديل المنتج": [
"Edit product",
"Produkt bearbeiten"
],
"إضافة منتج جديد": [
"Add a new product",
"Neues Produkt hinzufügen"
],
"العودة إلى المنتجات": [
"Back to products",
"Zurück zu den Produkten"
],
"حفظ التعديلات": [
"Save changes",
"Änderungen speichern"
],
"نشر المنتج": [
"Publish product",
"Produkt veröffentlichen"
],
"تم حفظ التعديلات": [
"Changes saved",
"Änderungen gespeichert"
],
"تم نشر منتجك، وسيظهر للعملاء الآن": [
"Your product was published and will now appear to customers",
"Ihr Produkt wurde veröffentlicht und erscheint jetzt für Kunden"
],
"تم حذف المنتج": [
"Product deleted",
"Produkt gelöscht"
],
"جارٍ الحفظ…": [
"Saving…",
"Wird gespeichert…"
],
"اسم المنتج {n} أحرف على الأقل": [
"The product name must be at least {n} characters",
"Der Produktname muss mindestens {n} Zeichen haben"
],
"أدخل سعراً أكبر من صفر": [
"Enter a price greater than zero",
"Geben Sie einen Preis größer als null ein"
],
"الكمية المتوفرة *": [
"Available quantity *",
"Verfügbare Menge *"
],
"المواصفات (سطر لكل مواصفة)": [
"Specifications (one per line)",
"Spezifikationen (eine pro Zeile)"
],
"اسم المنتج بالعربية": [
"Product name in Arabic",
"Produktname auf Arabisch"
],
"اسم المنتج بالإنجليزية": [
"Product name in English",
"Produktname auf Englisch"
],
"اسم المنتج بالألمانية": [
"Product name in German",
"Produktname auf Deutsch"
],
"الوصف بالعربية": [
"Description in Arabic",
"Beschreibung auf Arabisch"
],
"الوصف بالإنجليزية": [
"Description in English",
"Beschreibung auf Englisch"
],
"الوصف بالألمانية": [
"Description in German",
"Beschreibung auf Deutsch"
],
"الترجمات (ar / en / de)": [
"Translations (ar / en / de)",
"Übersetzungen (ar / en / de)"
],
"لو تركت لغة فارغة سيظهر للعميل النص الإنجليزي ثم العربي بدلاً منها.": [
"If you leave a language empty, customers will see the English text, then Arabic, instead.",
"Wenn Sie eine Sprache leer lassen, sehen Kunden stattdessen den englischen, dann den arabischen Text."
],
"عربي": [
"Arabic",
"Arabisch"
],
"إنجليزي": [
"English",
"Englisch"
],
"ألماني": [
"German",
"Deutsch"
],
"اسم المنتج بالعربية مطلوب": [
"The Arabic product name is required",
"Der arabische Produktname ist erforderlich"
],
"المنتجات المفضلة": [
"Favorite products",
"Favorisierte Produkte"
],
"أنت بعيد عن المتاجر": [
"You are far from stores",
"Sie sind weit von den Shops entfernt"
],
"{n} منتجات في السلة": [
"{n} items in cart",
"{n} Artikel im Warenkorb"
],
"{n} منتج في السلة": [
"{n} item in cart",
"{n} Artikel im Warenkorb"
],
"منتج واحد في السلة": [
"1 item in cart",
"1 Artikel im Warenkorb"
],
"في السلة": [
"in cart",
"im Warenkorb"
],
"قبعات وأوشحة": [
"Hats & Scarves",
"Hüte & Schals"
],
"مجوهرات": [
"Jewelry",
"Schmuck"
],
"نظارات": [
"Sunglasses",
"Sonnenbrillen"
],
"ساعات": [
"Watches",
"Uhren"
],
"تكييفات": [
"Air Conditioners",
"Klimaanlagen"
],
"بوتاجازات": [
"Cookers",
"Herde"
],
"ثلاجات": [
"Refrigerators",
"Kühlschränke"
],
"أجهزة مطبخ": [
"Kitchen Appliances",
"Küchengeräte"
],
"مكانس": [
"Vacuum Cleaners",
"Staubsauger"
],
"غسالات": [
"Washing Machines",
"Waschmaschinen"
],
"زيوت وسوائل": [
"Oils & Fluids",
"Öle & Flüssigkeiten"
],
"إكسسوارات": [
"Accessories",
"Accessoires"
],
"إطارات": [
"Tires",
"Reifen"
],
"شنط ظهر": [
"Backpacks",
"Rucksäcke"
],
"حقائب يد": [
"Handbags",
"Handtaschen"
],
"حقائب سفر": [
"Travel Bags",
"Reisetaschen"
],
"محافظ": [
"Wallets",
"Geldbörsen"
],
"عناية بالشعر": [
"Haircare",
"Haarpflege"
],
"مكياج": [
"Makeup",
"Make-up"
],
"عطور": [
"Perfumes",
"Parfüms"
],
"عناية بالبشرة": [
"Skincare",
"Hautpflege"
],
"كتب": [
"Books",
"Bücher"
],
"شنط مدرسية": [
"School Bags",
"Schultaschen"
],
"قرطاسية": [
"Stationery",
"Schreibwaren"
],
"أطفال": [
"Kids",
"Kinder"
],
"رجالي": [
"Men",
"Herren"
],
"ملابس رياضية": [
"Sportswear",
"Sportbekleidung"
],
"نسائي": [
"Women",
"Damen"
],
"كاميرات": [
"Cameras",
"Kameras"
],
"ألعاب فيديو": [
"Video Games",
"Videospiele"
],
"سماعات": [
"Headphones",
"Kopfhörer"
],
"لابتوب": [
"Laptops",
"Laptops"
],
"موبايلات": [
"Mobile Phones",
"Handys"
],
"تلفزيونات": [
"TVs",
"Fernseher"
],
"ساعات ذكية": [
"Smartwatches",
"Smartwatches"
],
"مفروشات": [
"Bedding",
"Bettwaren"
],
"أواني الطهي": [
"Cookware",
"Kochgeschirr"
],
"ديكور": [
"Decor",
"Dekoration"
],
"أثاث": [
"Furniture",
"Möbel"
],
"إضاءة": [
"Lighting",
"Beleuchtung"
],
"تخزين وتنظيم": [
"Storage & Organization",
"Aufbewahrung & Ordnung"
],
"مستلزمات": [
"Supplies",
"Zubehör"
],
"طعام": [
"Food",
"Futter"
],
"ألعاب": [
"Toys",
"Spielzeug"
],
"رياضي": [
"Sports",
"Sport"
],
"دراجات": [
"Bicycles",
"Fahrräder"
],
"أجهزة لياقة": [
"Fitness Equipment",
"Fitnessgeräte"
],
"كرات": [
"Balls",
"Bälle"
],
"يوجا": [
"Yoga",
"Yoga"
],
"منظفات": [
"Cleaning Supplies",
"Reinigungsmittel"
],
"زيوت وطبخ": [
"Oils & Cooking",
"Öle & Kochen"
],
"مشروبات": [
"Drinks",
"Getränke"
],
"مواد غذائية": [
"Groceries",
"Lebensmittel"
],
"عدد يدوية": [
"Hand Tools",
"Handwerkzeuge"
],
"أدوات كهربائية": [
"Power Tools",
"Elektrowerkzeuge"
],
"إضاءة ورش": [
"Work Lights",
"Arbeitsleuchten"
],
"ألعاب تركيب": [
"Building Toys",
"Bauspielzeug"
],
"ألعاب محشوة": [
"Plush Toys",
"Kuscheltiere"
],
"سيارات ومركبات": [
"Cars & Vehicles",
"Autos & Fahrzeuge"
],
"أجهزة منزلية": [
"Home Appliances",
"Haushaltsgeräte"
],
"السيارات": [
"Automotive",
"Auto"
],
"حقائب": [
"Bags",
"Taschen"
],
"الجمال والعناية": [
"Beauty & Care",
"Schönheit & Pflege"
],
"كتب وقرطاسية": [
"Books & Stationery",
"Bücher & Schreibwaren"
],
"ملابس": [
"Clothing",
"Kleidung"
],
"إلكترونيات": [
"Electronics",
"Elektronik"
],
"المنزل والمطبخ": [
"Home & Kitchen",
"Haus & Küche"
],
"حيوانات أليفة": [
"Pets",
"Haustiere"
],
"أحذية": [
"Shoes",
"Schuhe"
],
"رياضة ولياقة": [
"Sports & Fitness",
"Sport & Fitness"
],
"سوبر ماركت": [
"Supermarket",
"Supermarkt"
],
"عدد وأدوات": [
"Tools",
"Werkzeug"
],
"ألعاب وأطفال": [
"Toys & Kids",
"Spielzeug & Kinder"
],
"هذا البريد الإلكتروني مسجَّل من قبل.": [
"This email address is already registered.",
"Diese E-Mail-Adresse ist bereits registriert."
],
"هذا البريد الإلكتروني مسجَّل بحساب من قبل. سجّل الدخول بدلاً من إنشاء حساب جديد.": [
"This email is already registered. Sign in instead of creating a new account.",
"Diese E-Mail ist bereits registriert. Melden Sie sich an, statt ein neues Konto zu erstellen."
],
"كلمة المرور قصيرة جدًا (٦ أحرف على الأقل).": [
"The password is too short (at least 6 characters).",
"Das Passwort ist zu kurz (mindestens 6 Zeichen)."
],
"محاولات كثيرة، حاول بعد قليل.": [
"Too many attempts, try again shortly.",
"Zu viele Versuche, bitte versuchen Sie es gleich erneut."
],
"أكمل الاسم والبريد والهاتف وكلمة المرور.": [
"Complete your name, email, phone and password.",
"Vervollständigen Sie Name, E-Mail, Telefon und Passwort."
],
"تم إنشاء الحساب. الرجاء تأكيد بريدك الإلكتروني من الرسالة المُرسلة إليك قبل تسجيل الدخول.": [
"Your account was created. Please confirm your email using the message we sent you before signing in.",
"Ihr Konto wurde erstellt. Bitte bestätigen Sie Ihre E-Mail über die gesendete Nachricht, bevor Sie sich anmelden."
],
"أكمل اسم المتجر ورقم الهاتف والعنوان.": [
"Complete the store name, phone number and address.",
"Vervollständigen Sie Shop-Name, Telefonnummer und Adresse."
],
"أنشئ حسابك أولاً قبل تقديم طلب المتجر.": [
"Create your account first before submitting the store application.",
"Erstellen Sie zuerst Ihr Konto, bevor Sie den Shop-Antrag senden."
],
"أنشئ حسابك أولاً قبل تقديم طلب الانضمام.": [
"Create your account first before submitting the application.",
"Erstellen Sie zuerst Ihr Konto, bevor Sie die Bewerbung senden."
],
"أنشئ حسابك أولاً قبل رفع الصور.": [
"Create your account first before uploading photos.",
"Erstellen Sie zuerst Ihr Konto, bevor Sie Fotos hochladen."
],
"أكمل الاسم ورقم الهاتف.": [
"Complete your name and phone number.",
"Vervollständigen Sie Namen und Telefonnummer."
],
"تعذّر إنشاء المتجر.": [
"Could not create the store.",
"Der Shop konnte nicht erstellt werden."
],
"تعذّر إنشاء حساب المندوب.": [
"Could not create the courier account.",
"Das Kurierkonto konnte nicht erstellt werden."
],
"حدث خطأ غير متوقع.": [
"An unexpected error occurred.",
"Ein unerwarteter Fehler ist aufgetreten."
],
"تعذّر رفع الصورة.": [
"Could not upload the image.",
"Das Bild konnte nicht hochgeladen werden."
],
"تعذّر الاتصال بالخادم": [
"Could not reach the server",
"Verbindung zum Server fehlgeschlagen"
],
"حجم الصورة أكبر من 5 ميجابايت.": [
"The image is larger than 5 MB.",
"Das Bild ist größer als 5 MB."
],
"صيغة الصورة غير مدعومة (JPG أو PNG أو WEBP).": [
"Unsupported image format (JPG, PNG or WEBP).",
"Nicht unterstütztes Bildformat (JPG, PNG oder WEBP)."
]
}
};
