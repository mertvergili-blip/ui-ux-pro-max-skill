# Visual Clarity Checklist — Master (all videos)

Bu checklist her yeni video için, Kling generation ÖNCESINDE ve SONRASINDA
uygulanır. Video 022 deneyimi ve 5-görsel referans setinden türetilmiştir.
Kalıcı proje standardıdır.

## PRE-GENERATION: Character Reference Sheet (zorunlu, 2026-07-01)

042'nin karakter tutarlılığı sorunlarının kök nedeni araştırıldı (bkz.
`data/ai_video_quality_research_2026.md`): salt text2video, referans
görsel olmadan, her sahnede karakteri sıfırdan "hayal ediyor" — bu yüzden
Charger kayboldu, Scene 4-5'te insan-benzeri figürler çıktı. Artık zorunlu:

- [ ] Her tekrarlayan karakter için `generate_character_reference.py` ile
      bir referans sheet (ön/45°/yan profil) üretildi mi? (Kling'in kendi
      text2image endpoint'i, yeni API key gerekmez)
- [ ] Bu referans görsel her sahnede `reference_image` alanına eklendi mi?
      (image2video ile bind edilecek, salt text2video değil)
- [ ] Karakter prompt'u 2-3 detaya sıkıştırıldı mı? (silüet + 1 renk/doku —
      8+ detay "muddled"/tutarsız çıktıya sebep oluyor, araştırmayla kanıtlı)
- [ ] Trait-lock: referans sheet'teki renk/doku kelimeleri (örn. "pale
      faded yellow-white") her sahnede birebir aynı mı tekrarlanıyor?

## PRE-GENERATION: Karakter Tasarımı Kontrolü

Sahne promptu yazmadan önce şu soruları cevapla:

- [ ] Ana karakter ne? (obje/yaratık türü net mi?)
- [ ] Yüz tasarımı: göz, kaş, ağız net tanımlandı mı?
- [ ] Rol kostümü var mı? (tek aksesuar role anında tanıtmalı)
- [ ] Rakip/ikinci karakter varsa renk kontrastı açık mı?
- [ ] İki karakterin silüeti birbirine karışmıyor mu?
- [ ] Ana karakterin beden dili aksiyonu anlatıyor mu?
- [ ] "Bu karakter kim, ne yapıyor?" 1 saniyede anlaşılıyor mu?

## PRE-GENERATION: Sahne Aksiyonu Kontrolü

- [ ] Her sahnenin aksiyonu tek cümleyle tanımlanabildi mi?
      Format: "[karakter] [eylem] → [sonuç/reaksiyon]"
- [ ] Aksiyon net mi yoksa çok soyut mu?
- [ ] Kavga/yarış/yarışma varsa winner ve loser net mi?
- [ ] Reveal varsa revealed şey frame'de büyük ve net mi?

## PRE-GENERATION: Kompozisyon Kontrolü

- [ ] Ana karakter frame'in merkezinde mi?
- [ ] Ana karakter frame yüksekliğinin min %40'ını kaplıyor mu?
  (aksiyon sahnelerinde %50+)
- [ ] Caption safe area boş mu? (üst %20, alt %15 kritik aksiyon içermemeli)
- [ ] Arka plan dünyayı destekliyor ama ana aksiyonu boğmuyor mu?
- [ ] Wide shot kullanılıyorsa gerçekten gerekli mi?
  (aksiyon sahnelerinde medium shot zorunlu)

## POST-GENERATION: Görsel Netlik Kontrolü

Ses kapalı, altyazı yok — sadece görüntüye bak:

- [ ] "Ne oluyor?" sorusu 1–2 saniyede cevaplanabiliyor mu?
- [ ] Ana karakter(ler) büyük ve merkezi mi?
- [ ] Her karakterin yüzü (göz + kaş + ağız) net okunuyor mu?
- [ ] Karakterler birbirinden renk/aksesuar/silüet ile ayrılıyor mu?
- [ ] Aksiyon: hareket/vuruş/reaksiyon/sonuç net görünüyor mu?
  (motion blur içinde kaybolmamış)
- [ ] Sahne fazla karanlık veya soyut mu?
  (eğer "evet" → regenerate veya ışıklandırma talebi ekle)
- [ ] Container object (makine/çekmece/kumbara vb.) çerçeve görevi yapıyor,
  iç dünyayı boğmuyor mu?
- [ ] Arka plan kalabalığı/crowd varsa küçük ve arkada mı?

## POST-GENERATION: Thumbnail Gücü Kontrolü

- [ ] Bu sahnenin tek bir karesi, başlık olmadan thumbnail olarak çalışır mı?
- [ ] "Ne oluyor lan?" hissi veriyor mu?
- [ ] Ama aynı zamanda anlaşılır mı?
- [ ] Paylaşılabilir / rewatch değeri var mı?

## POST-GENERATION: Karakter Sürekliliği

- [ ] Tüm sahnelerde ana karakterin rengi aynı mı?
- [ ] Tüm sahnelerde ana karakterin aksesuarı aynı mı?
- [ ] Winner/loser rolleri son sahneye kadar tutarlı mı?

## POST-GENERATION: Hard Rules

- [ ] Gerçek insan yok, ünlü yok, telifli karakter yok
- [ ] Marka logosu, okunabilir metin, watermark yok
- [ ] Kan, gore, gerçekçi şiddet yok
- [ ] Klip içine caption/text gömülmemiş (captionlar sadece post'ta)
- [ ] Çok çocuksu / preschool estetik yok

## Reference Set 02 — Ek Kontrol Maddeleri (2026-07-01)

Her sahne için, generation öncesi ve sonrası:

- [ ] Karakterin rol kostümü/aksesuarı var mı? (tek aksesuar rolü/türü
      anında tanıtmalı — aksesuarsız karakter yasak)
- [ ] Ana karakterin (özellikle konuşan/aksiyon yapan) yüzü frame'de
      yeterince büyük mü? (göz + kaş + ağız net okunuyor mu?)
- [ ] Sahne tek bakışta anlaşılır mı? ("ne oluyor" 1 saniyede belli mi?)
- [ ] Karakterler birbirinden renk / silüet / aksesuar / BOYUT ile
      ayrılıyor mu? (büyük vs küçük kontrastı da geçerli)
- [ ] Arka plan kalabalığı/crowd ana karakteri boğuyor mu?
      (küçük ve arkada olmalı — boğuyorsa düzelt)
- [ ] Clip içinde yanlışlıkla yazı / logo / text / neon / tabela / UI text /
      konuşma balonu oluşma riski var mı? (varsa negative prompt güçlendir)
- [ ] Multi-scene hikaye ise: karakterin aksesuarı + rengi + silüeti tüm
      sahnelerde birebir aynı mı?
- [ ] Konuşan karakter kameraya/3-4 dönük mü? (sırtı dönük diyalog yasak)

## Referans Görsel Politikası

Bu projeye yüklenen tüm referans görseller:
- Birebir kopyalanmaz
- Aynı karakterler ve sahneler tekrar üretilmez
- Sadece stil standardı ve tasarım kimliği için kullanılır
- "Same spirit, new original characters" mantığıyla ilerle
- Yeni videolarda benden sürekli yeni referans görsel bekleme —
  bu stili kendi kendine uygula
