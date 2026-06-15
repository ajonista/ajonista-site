import "./index.css";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import schildFoto from "./assets/schild.png";
import statutenPdf from "./assets/statuten.pdf";
import clubliedMp3 from "./assets/clublied.mp3";
import bannerDesktop from "./assets/banner-desktop.png";
import bannerLaptop from "./assets/banner-laptop.png";
import bannerMobile from "./assets/banner-mobile.png";

import achtergrondDesktop from "./assets/achtergrond/achtergrond-desktop.png";
import achtergrondMacbook from "./assets/achtergrond/achtergrond-macbook.png";
import achtergrondClublied from "./assets/achtergrond/achtergrond-clublied.png";

import {
  FaInstagram,
  FaFacebookF,
  FaUser,
  FaPhoneAlt,
  FaGraduationCap,
  FaPen,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";

/* =========================
   Helpers
========================= */

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

/* =========================
   Achtergrond per pagina
========================= */

function PageBackground({ children, variant = "default" }) {
  const variants = {
    events:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.32),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)]",
    praesidium:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.34),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)]",
    clublied:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.36),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)]",
    lidworden:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.34),transparent_38%),radial-gradient(circle_at_50%_48%,rgba(220,170,45,0.12),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)]",
    statuten:
      "bg-[radial-gradient(circle_at_50%_8%,rgba(220,170,45,0.32),transparent_38%),radial-gradient(circle_at_50%_55%,rgba(220,170,45,0.10),transparent_45%),linear-gradient(180deg,#050400_0%,#010101_52%,#0b0702_100%)]",
    default: "bg-[#010101]",
  };

  return (
    <section
      className={`relative min-h-screen overflow-hidden ${
        variants[variant] || variants.default
      }`}
    >
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 hidden opacity-[0.05] sm:block bg-[linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-[size:42px_42px]" />

      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-[#dcaa2d]/10 blur-3xl sm:top-24" />

      {/* Groot schild rechts */}
      <img
        src={schildFoto}
        alt=""
        className="pointer-events-none absolute hidden object-contain opacity-[0.08] sm:block sm:-right-20 sm:top-24 sm:h-[28rem] sm:w-[28rem] lg:-right-6 lg:top-32 lg:h-[34rem] lg:w-[34rem]"
      />

      <div className="relative z-10">{children}</div>
    </section>
  );
}

/* =========================
   Gelijke titel + ondertitel
========================= */

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="mb-3 text-4xl font-black uppercase tracking-[0.16em] text-[#dcaa2d] sm:text-6xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mx-auto max-w-3xl text-base font-semibold leading-relaxed text-white/70 sm:text-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* =========================
   App
========================= */

function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [events, setEvents] = useState([]);
  const [praesidiumData, setPraesidiumData] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const [clubbladen, setClubbladen] = useState([]);
  const [selectedClubblad, setSelectedClubblad] = useState(null);
  const [filterAcademiejaar, setFilterAcademiejaar] = useState("Alle");

 useEffect(() => {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}, [page]); useEffect(() => {
  window.scrollTo(0, 0);
}, [page]);


  useEffect(() => {
    async function laadData() {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("volgorde", { ascending: true });

      const { data: praesidiumData } = await supabase
        .from("praesidium")
        .select("*")
        .order("volgorde", { ascending: true });

      const { data: clubbladenData, error: clubbladenError } = await supabase
        .from("'t_ajointjen")
        .select("*")
        .order("volgorde", { ascending: true });

      if (clubbladenError) console.error("Clubbladen fout:", clubbladenError);

      setEvents(eventsData || []);
      setPraesidiumData(praesidiumData || []);
      setClubbladen(clubbladenData || []);
    }

    laadData();
  }, []);

  const academiejaren = [
    "Alle",
    ...new Set(clubbladen.map((blad) => blad.academiejaar).filter(Boolean)),
  ];

  const gefilterdeClubbladen = clubbladen.filter((blad) => {
    return (
      filterAcademiejaar === "Alle" ||
      blad.academiejaar === filterAcademiejaar
    );
  });

  const goToPage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
    setSelectedClubblad(null);
  };

  return (
  <main>
      {/* =========================
          Navbar
      ========================= */}

      <nav className="fixed left-0 top-0 z-[1000] flex w-full items-center justify-between border-b border-[#dcaa2d]/30 bg-black/55 px-4 py-2 shadow-[0_3px_14px_rgba(0,0,0,0.35)] backdrop-blur-md md:px-6 md:py-3">
        {/* Logo links */}
        <button onClick={() => goToPage("home")} className="flex items-center">
          <img src={schildFoto} alt="Ajonista" className="h-10 w-auto md:h-11" />
        </button>

        {/* Hamburger mobiel */}
        <button
          className="rounded-full bg-[#dcaa2d] px-4 py-2 text-lg font-black text-black md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        {/* Menu */}
        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute right-4 top-16 w-64 flex-col gap-2 rounded-3xl border border-[#dcaa2d]/55 bg-black/95 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.65)] backdrop-blur-md md:static md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {[
            "home",
            "praesidium",
            "clublied",
            "events",
            "t_ajointjen",
            "lidworden",
            "statuten",
          ].map((item) => (
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
                : item === "t_ajointjen"
                ? "'t Ajointjen"
                : "Home"}
            </button>
          ))}
        </div>

        {/* Socials desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            className="grid h-9 w-9 place-items-center rounded-full border border-[#dcaa2d]/65 bg-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black"
            href="https://www.instagram.com/ajonista.aalst?igsh=YzB0cHBoNjNqMmg="
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram />
          </a>

          <a
            className="grid h-9 w-9 place-items-center rounded-full border border-[#dcaa2d]/65 bg-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black"
            href="https://www.facebook.com/share/1BKHKGQqba/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF />
          </a>

          <a
            className="grid h-9 w-9 place-items-center rounded-full border border-[#dcaa2d]/65 bg-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black"
            href="mailto:ajonista.aalst@gmail.com"
          >
            <MdEmail />
          </a>
        </div>
      </nav>

      {/* =========================
          Home
      ========================= */}

      {page === "home" && (
  <section className="w-full bg-[#010101]">
    {/* Mobile */}
    <div className="pt-16 md:hidden">
      <img
        src={bannerMobile}
        alt="Ajonista banner mobiel"
        className="block w-full"
      />
    </div>

    {/* Laptop */}
    <div className="hidden pt-20 md:block xl:hidden">
      <img
        src={bannerLaptop}
        alt="Ajonista banner laptop"
        className="block w-full"
      />
    </div>

    {/* Desktop */}
    <div className="hidden pt-20 xl:block">
      <img
        src={bannerDesktop}
        alt="Ajonista banner desktop"
        className="block w-full"
      />
    </div>
    </section>
)}
        {/* =========================
            Praesidium
        ========================= */}

        {page === "praesidium" && (
          <PageBackground variant="praesidium">
            <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
              <div className="mx-auto max-w-6xl">
                <PageHeader title="Huidig Praesidium" />

                <div className="grid justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {praesidiumData.map((persoon) => (
                    <button
                      key={persoon.id}
                      type="button"
                      onClick={() => setSelectedMember(persoon)}
                      className="group w-full max-w-[280px] cursor-pointer rounded-3xl border border-[#dcaa2d]/30 bg-black/60 p-6 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#dcaa2d] active:scale-[0.98]"
                    >
                      <img
                        src={persoon.foto_url}
                        alt={persoon.naam}
                        className="mx-auto mb-4 h-28 w-28 rounded-full border-2 border-[#dcaa2d] object-cover"
                      />

                      <h3 className="mb-1 text-lg font-black text-[#dcaa2d]">
                        {persoon.functie}
                      </h3>

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
      {/* =========================
          Praesidium modal
      ========================= */}

      {selectedMember && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[#111]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#dcaa2d] text-xl font-black text-black"
            >
              ×
            </button>

            <div className="grid md:grid-cols-[350px_1fr]">
              <img
                src={selectedMember.foto_url}
                alt={selectedMember.naam}
                className="h-80 w-full object-cover object-[center_35%] md:h-full"
              />

              <div className="p-6 md:p-8">
                <h2 className="text-3xl font-black text-[#dcaa2d]">
                  {selectedMember.functie}
                </h2>

                <h3 className="mb-6 text-xl font-bold text-white">
                  {selectedMember.naam}
                </h3>

                <div className="space-y-4 text-white">
                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">
                      Verjaardag
                    </p>
                    <p>{selectedMember.verjaardag}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">
                      {selectedMember.studie ? "Studie" : "Werk"}
                    </p>
                    <p>{selectedMember.studie || selectedMember.werk}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">
                      Favoriete cantuslied
                    </p>
                    <p>{selectedMember.cantuslied}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">
                      Favoriete quote
                    </p>
                    <p>{selectedMember.quote}</p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-[#dcaa2d]">
                      Favoriet drankje
                    </p>
                    <p>{selectedMember.drank}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Clublied
      ========================= */}

      {page === "clublied" && (
        <PageBackground variant="clublied">
          <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
            <div className="mx-auto max-w-6xl">
              <PageHeader
                title="Clublied"
                subtitle='Het clublied van Ajonista is op de wijze van "De Boemlala".'
              />

              <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-[#dcaa2d]/30 bg-black/50 p-5 backdrop-blur-md">
                <p className="mb-3 text-center text-sm font-black uppercase tracking-[0.16em] text-[#dcaa2d]">
                  Beluister het clublied
                </p>

                <audio controls className="w-full">
                  <source src={clubliedMp3} type="audio/mpeg" />
                  Je browser ondersteunt geen audio-element.
                </audio>
              </div>

              <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#dcaa2d]/30 bg-black/40 p-6 text-left backdrop-blur-md md:p-10">
                <div className="space-y-8 text-lg font-bold leading-8 md:text-xl">
                  <p>
                    <span className="mb-2 block text-2xl font-black text-[#dcaa2d]">
                      (Strofe 1)
                    </span>
                    Ajonista, moet naar hois toe gaan,
                    <br />
                    de pinten die zijn op (bis)
                    <br />
                    Zoin ze op, lotj ze op
                    <br />
                    Een nief vat slaan we op de kop
                  </p>

                  <p>
                    <span className="mb-2 block text-2xl font-black text-[#dcaa2d]">
                      (Refrein)
                    </span>
                    En Ajonista ging ni naar hois (bis)
                    <br />
                    Want Ajonista is weer op de zwier,
                    <br />
                    op de zwier, op de zwier
                    <br />
                    Ajonista is weer op de zwier met een vat bier
                  </p>

                  <p>
                    <span className="mb-2 block text-2xl font-black text-[#dcaa2d]">
                      (Strofe 2)
                    </span>
                    Ajonista, moet naar den toeig gaan,
                    <br />
                    au keel sta weeral droeig (bis)
                    <br />
                    Is ze droeig, lotj ze droeig
                    <br />
                    De volgende sta al op den toeig
                  </p>

                  <p>
                    <span className="mb-2 block text-2xl font-black text-[#dcaa2d]">
                      (Refrein)
                    </span>
                    En Ajonista ging naar den toeig (bis)
                    <br />
                    Want Ajonista is weer op de zwier,
                    <br />
                    op de zwier, op de zwier
                    <br />
                    Ajonista is weer op de zwier met een vat bier
                  </p>

                  <p>
                    <span className="mb-2 block text-2xl font-black text-[#dcaa2d]">
                      (Strofe 3)
                    </span>
                    Ajonista, moet naar hois toe gaan,
                    <br />
                    au vat is weeral op (bis)
                    <br />
                    Is het op, lotj het op
                    <br />
                    Sebiet kuiste mijne spaav weer op
                  </p>

                  <p>
                    <span className="mb-2 block text-2xl font-black text-[#dcaa2d]">
                      (Refrein)
                    </span>
                    En Ajonista ging naar hois (bis)
                    <br />
                    Want Ajonista was weer op de zwier,
                    <br />
                    op de zwier, op de zwier
                    <br />
                    Ajonista was weer op de zwier met teveel bier
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PageBackground>
      )}

      {/* =========================
          Events
      ========================= */}

      {page === "events" && (
        <PageBackground variant="events">
          <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
            <div className="mx-auto max-w-6xl">
              <PageHeader title="Events" subtitle="Komende events" />

              <div className="space-y-3 sm:space-y-5">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[#dcaa2d]/25 bg-black/60 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.40)] backdrop-blur-xl sm:grid sm:grid-cols-[130px_1fr] sm:gap-5 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0"
                  >
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
                          {event.beschrijving ||
                            "Meer informatie volgt binnenkort"}
                        </p>

                        {index === 0 && (
                          <span className="mt-4 hidden rounded-full bg-[#dcaa2d] px-4 py-2 text-xs font-black uppercase tracking-wider text-black sm:inline-flex">
                            Eerstvolgende event
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-col items-center gap-2">
                        {maakAgendaLink(event) && (
                          <a
                            href={maakAgendaLink(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-56 items-center justify-center rounded-full bg-[#dcaa2d] text-xs font-black uppercase tracking-wider text-black transition hover:scale-105"
                          >
                            Agenda
                          </a>
                        )}

                        {event.facebook_link && (
                          <a
                            href={event.facebook_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-56 items-center justify-center rounded-full bg-[#dcaa2d] text-xs font-black uppercase tracking-wider text-black transition hover:scale-105"
                          >
                            Event bekijken
                          </a>
                        )}

                        {event.fotoalbum && (
                          <a
                            href={event.fotoalbum}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-56 items-center justify-center rounded-full bg-[#dcaa2d] text-xs font-black uppercase tracking-wider text-black transition hover:scale-105"
                          >
                            Foto's bekijken
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageBackground>
      )}

      {/* =========================
          't Ajointjen overzicht
      ========================= */}

      {page === "t_ajointjen" && !selectedClubblad && (
  <PageBackground variant="events">
    <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="'t Ajointjen"
          subtitle="Het clubblad van Ajonista. Nieuwste edities eerst."
        />

        <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <label className="text-sm font-black uppercase tracking-wider text-[#dcaa2d]">
            Academiejaar
          </label>

          <select
            value={filterAcademiejaar}
            onChange={(e) => setFilterAcademiejaar(e.target.value)}
            className="w-full rounded-full border border-[#dcaa2d]/40 bg-black px-5 py-3 text-sm font-black text-white outline-none sm:w-auto"
          >
            {academiejaren.map((jaar) => (
              <option key={jaar} value={jaar}>
                {jaar}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center">
          {gefilterdeClubbladen.map((blad) => (
            <button
              key={blad.id}
              type="button"
              onClick={() => setSelectedClubblad(blad)}
              className="w-full max-w-[360px] overflow-hidden rounded-[1.5rem] border border-[#dcaa2d]/25 bg-black/60 text-left shadow-[0_10px_20px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-[#dcaa2d]"
            >
              <img
                src={blad.afbeelding_url}
                alt={blad.naam_clubblad}
                className="h-[505px] w-full object-contain object-top"
              />

              <div className="p-5">
                <h3 className="mb-3 text-xl font-black text-[#dcaa2d]">
                  {blad.naam_clubblad}
                </h3>

                <p className="mb-4 text-sm text-white/65">
                  {blad.sub_titel}
                </p>

                <p className="text-sm font-bold text-white/45">
                  {blad.maand} {blad.jaar}
                </p>
              </div>
            </button>
          ))}
        </div>

        {gefilterdeClubbladen.length === 0 && (
          <p className="mt-12 text-center text-white/60">
            Geen clubbladen gevonden.
          </p>
        )}
      </div>
    </div>
  </PageBackground>
)}
      {/* =========================
          't Ajointjen detail
      ========================= */}

      {page === "t_ajointjen" && selectedClubblad && (
        <PageBackground variant="events">
          <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedClubblad(null)}
                  className="rounded-full bg-[#dcaa2d] px-6 py-3 text-sm font-black text-black transition hover:bg-[#f2c14b]"
                >
                  ← Terug naar overzicht
                </button>
              </div>

              <PageHeader title={selectedClubblad.naam_clubblad} />

              <div className="mx-auto flex flex-col items-center">
                <img
                  src={selectedClubblad.afbeelding_url}
                  alt={selectedClubblad.naam_clubblad}
                  className="mx-auto w-full max-w-[450px] object-contain md:max-w-[600px]"
                />
              </div>
            </div>
          </div>
        </PageBackground>
      )}
      {/* =========================
          Lid worden
      ========================= */}

         {page === "lidworden" && (
  <PageBackground variant="lidworden">
    <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Lid worden"
          subtitle="Word lid van Ajonista en maak deel uit van onze club. Vul je gegevens in en wij nemen contact met je op."
        />

        <div className="mx-auto mb-8 flex max-w-3xl items-center gap-6">
          <div className="h-[2px] flex-1 bg-[#dcaa2d]" />
          <img
            src={schildFoto}
            alt="Ajonista"
            className="h-32 w-auto object-contain"
          />
          <div className="h-[2px] flex-1 bg-[#dcaa2d]" />
        </div>

        <div className="mx-auto mb-8 max-w-3xl rounded-3xl border border-[#dcaa2d]/30 bg-white/[0.06] p-6 text-center shadow-[0_0_45px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-8">
          <h3 className="mb-4 text-lg font-black text-[#dcaa2d]">
            Lidmaatschap bij Ajonista
          </h3>

          <p className="mb-4 text-sm text-[#dcaa2d]/80">
            Wat houdt dit in?
          </p>

          <p className="mb-4 text-base leading-relaxed text-white/85 md:text-lg">
            Tijdens ons eerste werkingsjaar bedraagt het lidgeld{" "}
            <span className="font-black text-[#dcaa2d]">€30</span>, inclusief
            het officiële Ajonista-lint.
          </p>

          <p className="mb-4 text-base leading-relaxed text-white/85 md:text-lg">
            Om onze club een sterke start te geven, wordt elk nieuw lid dit jaar
            onmiddellijk commi. Deze uitzonderlijke regeling geldt enkel tijdens
            het eerste werkingsjaar van Ajonista.
          </p>

          <p className="text-base leading-relaxed text-white/85 md:text-lg">
            Vanaf volgend academiejaar zullen nieuwe leden opnieuw het
            traditionele schachtentraject doorlopen.
          </p>
        </div>

        <form
          name="lid-worden"
          method="POST"
          data-netlify="true"
          className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-[#dcaa2d]/30 bg-white/[0.06] p-5 shadow-[0_0_45px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-8"
          onSubmit={async (e) => {
            e.preventDefault();

            const form = e.currentTarget;
            const formData = new FormData(form);

            try {
              const response = await fetch("/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams(formData).toString(),
              });

              if (!response.ok) throw new Error("Verzenden mislukt");

              form.reset();
              setShowSuccess(true);
            } catch (error) {
              console.error(error);
              alert("Er ging iets mis bij het verzenden.");
            }
          }}
        >
          <input type="hidden" name="form-name" value="lid-worden" />

          {[
            ["naam", "Voornaam*", "Jouw voornaam", <FaUser />, "text", true],
            ["achternaam", "Achternaam*", "Jouw achternaam", <FaUser />, "text", true],
            ["email", "E-mail*", "jouw@email.com", <MdEmail />, "email", true],
            ["telefoon", "Telefoonnummer", "+32 4 123 45 67", <FaPhoneAlt />, "tel", false],
            ["studie", "Studierichting / werk", "Studierichting of werk", <FaGraduationCap />, "text", false],
          ].map(([name, label, placeholder, icon, type, required]) => (
            <label className="block" key={name}>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#dcaa2d]">
                {icon} {label}
              </span>

              <input
                type={type}
                name={name}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-[#dcaa2d] focus:ring-2 focus:ring-[#dcaa2d]/30"
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#dcaa2d]">
              <FaPen /> Bericht
            </span>

            <textarea
              name="bericht"
              rows="5"
              placeholder="Moest je nog iets willen toevoegen..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-[#dcaa2d] focus:ring-2 focus:ring-[#dcaa2d]/30"
            />
          </label>

          <button
            className="mt-4 w-full rounded-full bg-[#dcaa2d] px-8 py-4 text-base font-black uppercase tracking-[0.18em] text-black shadow-[0_0_30px_rgba(220,170,45,0.35)] transition hover:-translate-y-1 hover:bg-[#f2c14b] active:translate-y-0"
            type="submit"
          >
            Versturen
          </button>
        </form>
      </div>
    </div>
  </PageBackground>
)}

      {/* =========================
          Succesmelding lid worden
      ========================= */}

      {showSuccess && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-[#dcaa2d]/40 bg-[#111] p-8 text-center shadow-[0_0_40px_rgba(220,170,45,0.25)]">
            <div className="mb-4 text-5xl">🍻</div>

            <h3 className="mb-3 text-2xl font-black text-[#dcaa2d]">
              Bedankt!
            </h3>

            <p className="mb-6 text-white/80">
              Bedankt voor je interesse in Ajonista.
              <br />
              We nemen zo snel mogelijk contact met je op.
            </p>

            <button
              onClick={() => setShowSuccess(false)}
              className="rounded-full bg-[#dcaa2d] px-6 py-3 font-black text-black"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* =========================
          Statuten
      ========================= */}
       {page === "statuten" && (
  <PageBackground variant="statuten">
    <div className="px-4 pt-20 pb-20 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Statuten"
          subtitle="Hieronder vind je de officiële statuten van Ajonista."
        />

        {/* Mobiel */}
        <div className="md:hidden">
          <div className="flex flex-col items-center gap-4">
         <a
          href={statutenPdf}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm rounded-full bg-[#dcaa2d] px-8 py-3 text-center font-black text-black transition hover:bg-[#f2c14b]"
        >
          Open de statuten
        </a>

            <a
          href={statutenPdf}
          download
          className="w-full max-w-sm rounded-full border border-[#dcaa2d]/50 px-8 py-3 text-center font-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black"
        >
          Download de statuten
        </a>
          </div>
        </div>

        {/* Desktop & tablet */}
        <div className="hidden md:block">
          <div className="mb-8 flex justify-center">
            <a
              href={statutenPdf}
              download
              className="rounded-full border border-[#dcaa2d]/50 px-8 py-3 text-center font-black text-[#dcaa2d] transition hover:bg-[#dcaa2d] hover:text-black"
            >
              Download de statuten (PDF)
            </a>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#dcaa2d]/30 bg-white">
            <iframe
              src={`${statutenPdf}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
              title="Statuten Ajonista"
              className="h-[1600px] w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </PageBackground>
)}
      {/* =========================
          Footer
      ========================= */}

      <footer className="border-t border-[#dcaa2d]/25 bg-[#010101] px-5 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h3 className="mb-3 text-2xl font-black text-[#dcaa2d]">
              Ajonista
            </h3>
            <p className="text-white/75">
              De studentenclub in Aalst voor studenten die graag uitgaan in Aalst.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-lg font-black text-[#dcaa2d]">Socials</h4>

            <a
              className="mb-2 block text-white/75 hover:text-[#dcaa2d]"
              href="https://www.instagram.com/ajonista.aalst?igsh=YzB0cHBoNjNqMmg="
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>

            <a
              className="block text-white/75 hover:text-[#dcaa2d]"
              href="https://www.facebook.com/share/1BKHKGQqba/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </div>

          <div>
            <h4 className="mb-3 text-lg font-black text-[#dcaa2d]">Contact</h4>
            <p className="mb-2 text-white/75">9300 Aalst, België</p>

            <a
              className="text-white/75 hover:text-[#dcaa2d]"
              href="mailto:ajonista.aalst@gmail.com"
            >
              ajonista.aalst@gmail.com
            </a>
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