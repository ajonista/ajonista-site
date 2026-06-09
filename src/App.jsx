import "./index.css";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import schildFoto from "./assets/schild.png";
import { FaInstagram, FaFacebookF } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaUser, FaPhoneAlt, FaGraduationCap, FaPen } from "react-icons/fa";
import statutenPdf from "./assets/statuten.pdf";

function formatDatum(datum) {
  const date = new Date(datum);
  return date.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function maakAgendaLink(event) {
  if (!event.datum || !event.tijd || event.tijd === "TBA") return null;

  const start = new Date(`${event.datum}T${event.tijd}`);
  if (isNaN(start.getTime())) return null;

  const einde = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const formatDate = (date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.titel
  )}&dates=${formatDate(start)}/${formatDate(einde)}&details=${encodeURIComponent(
    event.beschrijving || ""
  )}&location=${encodeURIComponent(event.locatie || "")}`;
}

function PageBackground({ children, variant = "default" }) {
  const variants = {
    events:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.32),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)] sm:bg-[radial-gradient(circle_at_8%_12%,rgba(220,170,45,0.26),transparent_30%),radial-gradient(circle_at_92%_35%,rgba(220,170,45,0.14),transparent_32%),linear-gradient(180deg,#010101_0%,#120d05_55%,#010101_100%)]",

    praesidium:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.34),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)] sm:bg-[radial-gradient(circle_at_15%_15%,rgba(220,170,45,0.28),transparent_32%),radial-gradient(circle_at_90%_80%,rgba(220,170,45,0.18),transparent_34%),linear-gradient(135deg,#010101_0%,#151007_50%,#010101_100%)]",

    clublied:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.36),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)] sm:bg-[radial-gradient(circle_at_top_right,rgba(220,170,45,0.42),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(220,170,45,0.30),transparent_44%),linear-gradient(180deg,#010101_0%,#1f1607_55%,#010101_100%)]",

    lidworden:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.34),transparent_38%),radial-gradient(circle_at_50%_48%,rgba(220,170,45,0.12),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)] sm:bg-[radial-gradient(circle_at_50%_0%,rgba(220,170,45,0.26),transparent_30%),radial-gradient(circle_at_10%_85%,rgba(220,170,45,0.16),transparent_34%),linear-gradient(180deg,#010101_0%,#120d05_55%,#010101_100%)]",

    statuten:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.32),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)] sm:bg-[radial-gradient(circle_at_50%_0%,rgba(220,170,45,0.26),transparent_30%),radial-gradient(circle_at_10%_85%,rgba(220,170,45,0.16),transparent_34%),linear-gradient(180deg,#010101_0%,#120d05_55%,#010101_100%)]",

    default:
      "bg-[linear-gradient(180deg,#010101_0%,#0b0702_100%)] sm:bg-[linear-gradient(180deg,#010101_0%,#120d05_55%,#010101_100%)]",
  };

  return (
    <section
      className={`relative min-h-screen overflow-hidden ${
        variants[variant] || variants.default
      }`}
    >
      <div className="pointer-events-none absolute inset-0 hidden opacity-[0.05] sm:block bg-[linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-[#dcaa2d]/10 blur-3xl sm:top-24" />

      <img
        src={schildFoto}
        alt=""
        className="pointer-events-none absolute hidden object-contain opacity-[0.09] sm:block sm:-right-20 sm:top-24 sm:h-[28rem] sm:w-[28rem] lg:-right-6 lg:top-32 lg:h-[34rem] lg:w-[34rem] lg:opacity-[0.08]"
      />

      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#dcaa2d]/45 to-transparent" />

      <div className="relative z-10">{children}</div>
    </section>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [events, setEvents] = useState([]);
  const [praesidiumData, setPraesidiumData] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function laadData() {
      const { data: eventsData } = await supabase.from("events").select("*");

      const { data: praesidiumData } = await supabase
        .from("praesidium")
        .select("*")
        .order("volgorde", { ascending: true });

      setEvents(eventsData || []);
      setPraesidiumData(praesidiumData || []);
    }

    laadData();
  }, []);

  const goToPage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
  };

  return (
    <main>
      <nav className="fixed left-0 top-0 z-[1000] flex w-full items-center justify-end border-b border-[#dcaa2d]/30 bg-black/55 px-4 py-2 shadow-[0_3px_14px_rgba(0,0,0,0.35)] backdrop-blur-md md:justify-center md:px-6 md:py-4">
        <button
          className="rounded-full bg-[#dcaa2d] px-4 py-2 text-lg font-black text-black md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute right-4 top-14 w-56 flex-col gap-2 rounded-2xl border border-[#dcaa2d]/55 bg-black p-3 md:static md:flex md:w-auto md:flex-row md:border-0 md:bg-transparent md:p-0`}
        >
          {["home", "events", "praesidium", "clublied", "lidworden", "statuten"].map((item) => (
            <button
              key={item}
              onClick={() => goToPage(item)}
              className={`rounded-full border border-[#dcaa2d]/55 px-5 py-2 text-left text-sm font-extrabold tracking-wide transition hover:bg-[#dcaa2d]/20 hover:text-[#dcaa2d] md:text-center ${
                page === item
                  ? "bg-[#dcaa2d] text-black shadow-[0_0_20px_rgba(220,170,45,0.55)]"
                  : "bg-transparent text-white"
              }`}
            >
              {item === "lidworden"
                ? "Lid worden"
                : item === "statuten"
                ? "Statuten"
                : item === "praesidium"
                ? "Praesidium"
                : item === "clublied"
                ? "Clublied"
                : item === "events"
                ? "Events"
                : "Home"}
            </button>
          ))}
        </div>

        <div className="absolute right-20 flex gap-2 md:right-6">
          <a className="grid h-8 w-8 place-items-center rounded-full border border-[#dcaa2d]/65 bg-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black md:h-9 md:w-9" href="https://www.instagram.com/ajonista.aalst?igsh=YzB0cHBoNjNqMmg=" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
          <a className="grid h-8 w-8 place-items-center rounded-full border border-[#dcaa2d]/65 bg-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black md:h-9 md:w-9" href="https://www.facebook.com/share/1BKHKGQqba/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
            <FaFacebookF />
          </a>
          <a className="grid h-8 w-8 place-items-center rounded-full border border-[#dcaa2d]/65 bg-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black md:h-9 md:w-9" href="mailto:ajonista.aalst@gmail.com">
            <MdEmail />
          </a>
        </div>
      </nav>

      {page === "home" && (
        <section className="flex min-h-screen w-full items-center justify-center bg-[#010101] px-0 pt-20">
          <picture className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
            <source media="(min-width: 1280px)" srcSet="/src/assets/banner-desktop.png" />
            <source media="(min-width: 768px)" srcSet="/src/assets/banner-laptop.png" />
            <img src="/src/assets/banner-mobile.png" alt="Ajonista banner" className="max-h-full w-full object-contain" />
          </picture>
        </section>
      )}

      {page === "events" && (
        <PageBackground variant="events">
          <div className="px-4 pt-28 pb-20 text-white sm:px-8 lg:px-16">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-2 text-4xl font-black uppercase tracking-[0.12em] text-[#dcaa2d] sm:text-6xl">
                Events
              </h2>

              <p className="mb-7 text-base font-semibold text-white/60 sm:text-xl">
                Komende events
              </p>

              <div className="space-y-3 sm:space-y-5">
                {events.map((event, index) => (
                  <div key={event.id} className="rounded-2xl border border-[#dcaa2d]/25 bg-black/60 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.40)] backdrop-blur-xl sm:grid sm:grid-cols-[130px_1fr] sm:gap-5 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
                    <div className="mb-3 flex items-center justify-between sm:mb-0 sm:grid sm:min-h-[140px] sm:place-items-center sm:rounded-3xl sm:border sm:border-[#dcaa2d]/40 sm:bg-black/70">
                      <span className="text-3xl font-black text-[#dcaa2d] sm:text-5xl">
                        {formatDatum(event.datum)}
                      </span>

                      {index === 0 && (
                        <span className="rounded-full bg-[#dcaa2d] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black sm:hidden">
                          Volgende
                        </span>
                      )}
                    </div>

                    <div className="sm:flex sm:min-h-[140px] sm:items-center sm:justify-between sm:gap-8 sm:rounded-3xl sm:border sm:border-[#dcaa2d]/35 sm:bg-white/[0.04] sm:p-8 sm:backdrop-blur-xl">
                      <div>
                        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.15em] text-[#dcaa2d] sm:text-xs">
                          {event.tijd} • {event.locatie}
                        </p>

                        <h3 className="mb-1 text-xl font-black text-white sm:text-4xl">
                          {event.titel}
                        </h3>

                        <p className="text-sm leading-relaxed text-white/60 sm:text-base">
                          {event.beschrijving || "Meer informatie volgt binnenkort"}
                        </p>

                        {index === 0 && (
                          <span className="mt-4 hidden rounded-full bg-[#dcaa2d] px-4 py-2 text-xs font-black uppercase tracking-wider text-black sm:inline-flex">
                            Eerstvolgende event
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:min-w-[220px] sm:grid-cols-1 sm:gap-3">
                        {maakAgendaLink(event) && (
                          <a href={maakAgendaLink(event)} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center rounded-full bg-[#dcaa2d] text-xs font-black uppercase tracking-wider text-black sm:h-12 sm:text-sm">
                            Agenda
                          </a>
                        )}

                        <a
                          href={event.facebook || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!event.facebook) e.preventDefault();
                          }}
                          className="flex h-10 items-center justify-center rounded-full border border-dashed border-[#dcaa2d]/40 text-xs font-black uppercase tracking-wider text-white/50 sm:h-12 sm:text-sm"
                        >
                          {event.facebook ? "Facebook" : "Facebook volgt"}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageBackground>
      )}

      {page === "praesidium" && (
        <PageBackground variant="praesidium">
          <div className="relative px-4 pt-28 pb-20 text-white md:px-10 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-12 text-center text-4xl font-black uppercase tracking-[0.15em] text-[#dcaa2d] md:text-6xl">
                Huidig Praesidium
              </h2>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {praesidiumData.map((persoon) => (
                  <button key={persoon.id} type="button" onClick={() => setSelectedMember(persoon)} className="group cursor-pointer rounded-3xl border border-[#dcaa2d]/30 bg-black/60 p-6 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#dcaa2d] active:scale-[0.98]">
                    <img src={persoon.foto_url} alt={persoon.naam} className="mx-auto mb-4 h-28 w-28 rounded-full border-2 border-[#dcaa2d] object-cover" />
                    <h3 className="mb-1 text-lg font-black text-[#dcaa2d]">{persoon.functie}</h3>
                    <p className="font-semibold text-white">{persoon.naam}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#dcaa2d] opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
                      Tik voor profiel
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PageBackground>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#111]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedMember(null)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#dcaa2d] text-xl font-black text-black">
              ×
            </button>

            <div className="grid md:grid-cols-[350px_1fr]">
              <img src={selectedMember.foto_url} alt={selectedMember.naam} className="h-80 w-full object-cover object-[center_35%] md:h-full" />

              <div className="p-6 md:p-8">
                <h2 className="text-3xl font-black text-[#dcaa2d]">{selectedMember.functie}</h2>
                <h3 className="mb-6 text-xl font-bold text-white">{selectedMember.naam}</h3>

                <div className="space-y-4 text-white">
                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">Verjaardag</p>
                    <p>{selectedMember.verjaardag}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">
                      {selectedMember.studie ? "Studie" : "Werk"}
                    </p>
                    <p>{selectedMember.studie || selectedMember.werk}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">Favoriete cantuslied</p>
                    <p>{selectedMember.cantuslied}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">Favoriete quote</p>
                    <p>{selectedMember.quote}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">Favoriet drankje</p>
                    <p>{selectedMember.drank}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === "clublied" && (
        <PageBackground variant="clublied">
          <div className="px-5 pt-32 pb-20 text-white">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-5 text-5xl font-black uppercase tracking-[0.12em] text-[#dcaa2d] md:text-7xl">
                Clublied
              </h2>

              <p className="mb-10 text-lg text-white/80">
                Het clublied van Ajonista is op de wijze van "De Boemlala".
              </p>

              <div className="mx-auto max-w-3xl rounded-[1.8rem] border border-[#dcaa2d]/30 bg-black/40 p-6 text-left backdrop-blur-md md:p-10">
                <div className="space-y-8 text-lg font-bold leading-8 md:text-xl">
                  <p><span className="mb-2 block text-2xl font-black text-[#dcaa2d]">(Strofe 1)</span>Ajonista, ge moet naar huis toe gaan,<br />de pinten die zijn op (bis)<br />Zijn ze op, laat ze op<br />Een nieuw vat slaan we op de kop</p>
                  <p><span className="mb-2 block text-2xl font-black text-[#dcaa2d]">(Refrein)</span>En Ajonista ging ni naar huis (bis)<br />Want Ajonista is weer op de zwier,<br />op de zwier, op de zwier<br />Ajonista is weer op de zwier met een vat bier</p>
                  <p><span className="mb-2 block text-2xl font-black text-[#dcaa2d]">(Strofe 2)</span>Ajonista, ge moet naar den toog,<br />u keel sta weeral droog (bis)<br />Is ze droog, laat ze droog<br />De volgende sta al op den toog</p>
                  <p><span className="mb-2 block text-2xl font-black text-[#dcaa2d]">(Refrein)</span>En Ajonista ging naar den toog (bis)<br />Want Ajonista is weer op de zwier,<br />op de zwier, op de zwier<br />Ajonista is weer op de zwier met een vat bier</p>
                  <p><span className="mb-2 block text-2xl font-black text-[#dcaa2d]">(Strofe 3)</span>Ajonista, ge moet naar huis toe gaan,<br />u vat is weeral op (bis)<br />Is ze op, laat ze op<br />sebiet kuiste mijn spaav weer op</p>
                  <p><span className="mb-2 block text-2xl font-black text-[#dcaa2d]">(Refrein)</span>En Ajonista ging naar huis (bis)<br />Want Ajonista was weer op de zwier,<br />op de zwier, op de zwier<br />Ajonista was weer op de zwier met teveel bier</p>
                </div>
              </div>
            </div>
          </div>
        </PageBackground>
      )}

      {page === "lidworden" && (
        <PageBackground variant="lidworden">
          <div className="px-4 pt-32 pb-20 text-white md:px-10 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-center text-4xl font-black uppercase tracking-[0.18em] text-[#dcaa2d] md:text-5xl">
                Lid worden
              </h2>

              <div className="mb-8 flex items-center justify-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#dcaa2d]" />
                <img src={schildFoto} alt="Ajonista schild" className="h-24 w-24 object-contain mix-blend-screen drop-shadow-[0_0_25px_rgba(220,170,45,0.45)] md:h-32 md:w-32" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#dcaa2d]" />
              </div>

              <div className="mb-10 text-center text-base leading-relaxed text-white/80 md:text-lg">
                <p>Word lid van Ajonista en maak deel uit van onze club.</p>
                <p>Vul je gegevens in en wij nemen contact met je op.</p>
              </div>

              <form
                className="mx-auto space-y-5 rounded-3xl border border-[#dcaa2d]/30 bg-white/[0.06] p-5 shadow-[0_0_45px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-8"
                name="lid-worden"
                method="POST"
                data-netlify="true"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowSuccess(true);
                }}
              >
                <input type="hidden" name="form-name" value="lid-worden" />

                {[
                  ["naam", "Voornaam*", "Jouw voornaam", <FaUser />, "text", true],
                  ["achternaam", "Achternaam*", "Jouw achternaam", <FaUser />, "text", true],
                  ["email", "E-mail*", "jouw@email.com", <MdEmail />, "email", true],
                  ["telefoon", "Telefoonnummer", "+32 4 123 45 67", <FaPhoneAlt />, "tel", false],
                  ["studie", "Studierichting / werk", "studierichting/werk?", <FaGraduationCap />, "text", false],
                ].map(([name, label, placeholder, icon, type, required]) => (
                  <label className="block" key={name}>
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#dcaa2d]">
                      {icon} {label}
                    </span>
                    <input type={type} name={name} placeholder={placeholder} required={required} className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-[#dcaa2d] focus:ring-2 focus:ring-[#dcaa2d]/30" />
                  </label>
                ))}

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#dcaa2d]">
                    <FaPen /> Bericht
                  </span>
                  <textarea name="bericht" rows="5" placeholder="moest je nog iets willen toevoegen..." className="w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-[#dcaa2d] focus:ring-2 focus:ring-[#dcaa2d]/30"></textarea>
                </label>

                <button className="mt-4 w-full rounded-full bg-[#dcaa2d] px-8 py-4 text-base font-black uppercase tracking-[0.18em] text-black shadow-[0_0_30px_rgba(220,170,45,0.35)] transition hover:-translate-y-1 hover:bg-[#f2c14b] active:translate-y-0" type="submit">
                  Versturen
                </button>
              </form>
            </div>
          </div>
        </PageBackground>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-[#dcaa2d]/40 bg-[#111] p-8 text-center shadow-[0_0_40px_rgba(220,170,45,0.25)]">
            <div className="mb-4 text-5xl">🍻</div>

            <h3 className="mb-3 text-2xl font-black text-[#dcaa2d]">Bedankt!</h3>

            <p className="mb-6 text-white/80">
              Bedankt voor je interesse in Ajonista.
              <br />
              We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op.
            </p>

            <button onClick={() => setShowSuccess(false)} className="rounded-full bg-[#dcaa2d] px-6 py-3 font-black text-black">
              Sluiten
            </button>
          </div>
        </div>
      )}

      {page === "statuten" && (
        <PageBackground variant="statuten">
          <div className="px-4 pt-32 pb-20 text-white md:px-10 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-6 text-center text-4xl font-black uppercase tracking-[0.16em] text-[#dcaa2d] md:text-6xl">
                Statuten
              </h2>

              <p className="mb-8 text-center text-lg text-white/70">
                Hieronder vind je de officiële statuten van Ajonista.
              </p>

              <div className="mb-6 flex flex-col justify-center gap-4 sm:flex-row">
                <a href={statutenPdf} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#dcaa2d] px-8 py-3 text-center font-black text-black transition hover:bg-[#f2c14b]">
                  Open statuten
                </a>

                <a href={statutenPdf} download className="rounded-full border border-[#dcaa2d]/50 px-8 py-3 text-center font-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black">
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </PageBackground>
      )}

      <footer className="border-t border-[#dcaa2d]/25 bg-[#010101] px-5 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h3 className="mb-3 text-2xl font-black text-[#dcaa2d]">Ajonista</h3>
            <p className="text-white/75">De studentenclub in Aalst voor studenten die graag uitgaan in Aalst.</p>
          </div>

          <div>
            <h4 className="mb-3 text-lg font-black text-[#dcaa2d]">Socials</h4>
            <a className="mb-2 block text-white/75 hover:text-[#dcaa2d]" href="https://www.instagram.com/ajonista.aalst?igsh=YzB0cHBoNjNqMmg=" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a className="block text-white/75 hover:text-[#dcaa2d]" href="https://www.facebook.com/share/1BKHKGQqba/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>

          <div>
            <h4 className="mb-3 text-lg font-black text-[#dcaa2d]">Contact</h4>
            <p className="mb-2 text-white/75">9300 Aalst, België</p>
            <a className="text-white/75 hover:text-[#dcaa2d]" href="mailto:ajonista.aalst@gmail.com">ajonista.aalst@gmail.com</a>
          </div>
        </div>

        <div className="mx-auto mt-9 max-w-6xl border-t border-[#dcaa2d]/15 pt-5 text-center text-sm text-white/50">
          © 2026 Ajonista
        </div>
      </footer>
    </main>
  );
}

export default App;