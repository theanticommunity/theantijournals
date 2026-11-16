export function AboutPage() {
  return (
    <div className="bg-white">
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="masthead mb-2">AntiPerson</div>
          <div className="masthead-sub mb-10">Independent publication</div>

          <h1 className="text-balance text-5xl md:text-6xl font-serif text-black leading-tight mb-10">
            AntiPerson
          </h1>

          <div className="article-body font-serif text-lg leading-relaxed">
            <p className="mb-6">
              AntiPerson is an independent digital publication built around human
              thoughts, observations, opinions, experiences, ideas, morality, humanity,
              and society.
            </p>

            <p className="mb-6">
              It is not a conventional news website, corporate blog, personal portfolio,
              or generic content platform. Its identity is independent, intellectually
              curious, minimalist, occasionally provocative, and unapologetically human.
            </p>

            <p className="mb-6">
              The publication explores human experiences, contradictions, beliefs,
              behaviours, relationships, morality, and existence. It is not restricted to
              a single subject or ideology. The writing may be uncomfortable,
              unconventional, critical, reflective, humorous, or controversial when the
              subject demands it.
            </p>

            <p className="mb-6">
              AntiPerson combines the character of an independent digital magazine, a
              contemporary literary journal, an experimental editorial publication, and a
              minimalist intellectual archive.
            </p>

            <p className="mb-6">
              Readers can explore free publications, purchase premium content, subscribe
              to paid memberships, and browse the archive — all without requiring an
              account.
            </p>
          </div>

          <hr className="my-12 border-black/10" />

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-serif text-black mb-6">Editorial direction</h2>
              <p className="text-secondary-grey text-sm leading-relaxed mb-4">
                Typography is central to the AntiPerson identity. Expressive serif
                typography for editorial headlines, paired with clean sans-serif for
                navigation and interface elements. The design relies on typography,
                contrast, spacing, composition, and imagery — colour is used sparingly.
              </p>
              <p className="text-secondary-grey text-sm leading-relaxed mb-4">
                The visual identity is predominantly monochromatic: black (#080808),
                white (#FFFFFF), dark grey (#171717), secondary grey (#777777), and light
                grey (#EAEAEA).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-black mb-6">Membership</h2>
              <p className="text-secondary-grey text-sm leading-relaxed mb-4">
                Free membership provides access to free publications, newsletter
                subscription, optional user accounts, and bookmarks.
              </p>
              <p className="text-secondary-grey text-sm leading-relaxed">
                Premium membership provides access to premium publications, exclusive
                articles, and member-only content.
              </p>
            </div>
          </div>

          <hr className="my-12 border-black/10" />

          <div className="text-center">
            <p className="text-secondary-grey text-sm">
              Questions or correspondence can be directed to the publication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;