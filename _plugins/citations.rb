=begin
  Citations for the Cite button under every paper and book chapter
  (_includes/publication_entry.html, _includes/cite_dialog.html, js/site.js).

  At build time each entry of _data/publist.yml and _data/chapters.yml gets a
  `cite_id`, which is also its BibTeX key ("seo2026functional"), and one file,
  /publications/cite.json, holds each entry's citation in five forms under
  that id: APA and Nature style as plain text, and BibTeX, RIS and EndNote's
  tagged format for reference managers. The page fetches it the first time a
  Cite button is pressed, so the lists themselves stay as light as they were.

  Everything comes from the data, not from an outside service: the authors
  as printed (initials and surname), the volume, issue and pages taken apart
  from `vip` (whose form _plugins/data_check.rb enforces), and the DOI as a
  https://doi.org link. A paper without `vip` yet is cited as published
  online, with its DOI.
=end
require "json"

module Jekyll
  module Citations
    VIP = /\A(?<volume>[0-9]+)(?:\((?<issue>[^():]+)\))?:(?<first>[A-Za-z]*[0-9]+)(?:-(?<last>[A-Za-z]*[0-9]+))?(?<tail>\.e[0-9]+)?\z/
    SMALL_WORDS = %w[a an the of on in for and to by with from at as].freeze
    # The machine formats' characters that mean something to BibTeX.
    TEX = { "\\" => "\\textbackslash{}", "{" => "\\{", "}" => "\\}", "&" => "\\&", "%" => "\\%",
            "$" => "\\$", "#" => "\\#", "_" => "\\_", "~" => "\\textasciitilde{}", "^" => "\\textasciicircum{}" }.freeze

    class Generator < Jekyll::Generator
      safe true
      priority :high

      def generate(site)
        used = {}
        table = {}
        [["publist", false], ["chapters", true]].each do |file, chapter|
          Array(site.data[file]).each do |p|
            entry = Entry.new(p, chapter)
            id = entry.key(used)
            p["cite_id"] = id
            table[id] = entry.formats
          end
        end
        page = PageWithoutAFile.new(site, site.source, "publications", "cite.json")
        page.content = JSON.generate(table)
        # BibTeX titles sit in double braces, which Liquid would take for its own.
        page.data.merge!("layout" => nil, "sitemap" => false, "render_with_liquid" => false)
        site.pages << page
      end
    end

    # One paper or chapter, taken apart once for all five forms.
    class Entry
      def initialize(p, chapter)
        @chapter = chapter
        @authors = p["authors"].map do |a|
          parts = a["name"].to_s.split
          [parts.last, parts[0...-1].join(" ")]      # [surname, initials] as printed
        end
        @title = p["title"].to_s.strip
        @journal = p["journal"].to_s
        @year = p["year"].to_s
        @doi = p["doi"]&.to_s
        @url = @doi ? "https://doi.org/#{@doi}" : p["url"]
        m = VIP.match(p["vip"].to_s)
        if m
          @volume, @issue = m[:volume], m[:issue]
          @first = m[:first]
          @last = m[:last] ? "#{m[:last]}#{m[:tail]}" : nil
          @first += m[:tail].to_s unless m[:last]
        end
      end

      # surname + year + first real word of the title, in ASCII lower case;
      # "b", "c", ... after it when an earlier entry has it already. Call it
      # before #formats: the BibTeX entry carries it.
      def key(used)
        word = @title.split.map { |w| ascii(w) }.find { |w| !w.empty? && !SMALL_WORDS.include?(w) }
        base = "#{ascii(@authors.first&.first.to_s)}#{@year}#{word}"
        base = "paper#{@year}" if base == @year
        id = base
        suffix = "a"
        while used.key?(id)
          suffix = suffix.succ
          id = "#{base}#{suffix}"
        end
        used[id] = true
        @key = id
      end

      def formats
        { "apa" => apa, "nature" => nature, "bibtex" => bibtex, "ris" => ris, "endnote" => endnote }
      end

      private

      def ascii(text)
        text.unicode_normalize(:nfkd).downcase.gsub(/[^a-z0-9]/, "")
      end

      def names
        @authors.map { |surname, initials| initials.empty? ? surname : "#{surname}, #{initials}" }
      end

      # A sentence ends with one full stop, however the part before it ends.
      def sentence(text)
        text.match?(/[.?!]\z/) ? text : "#{text}."
      end

      def pages(dash)
        @last ? "#{@first}#{dash}#{@last}" : @first
      end

      # APA 7: every author up to 20 (19, an ellipsis and the last beyond),
      # "&" before the last; volume(issue), pages; the DOI as a link.
      def apa
        n = names
        authors = if n.size == 1 then n[0]
                  elsif n.size <= 20 then "#{n[0...-1].join(", ")}, & #{n[-1]}"
                  else "#{n[0, 19].join(", ")}, . . . #{n[-1]}"
                  end
        source = if @volume
                   "#{@journal}, #{@volume}#{"(#{@issue})" if @issue}, #{pages("–")}."
                 else
                   "#{@journal}. Advance online publication."
                 end
        [sentence(authors), "(#{@year}).", sentence(@title), source, (@url if @url)].compact.join(" ")
      end

      # Nature: up to five authors, "&" before the last; more, the first and
      # "et al."; then journal, volume, pages (year), or the DOI before the
      # year for a paper without pages yet.
      def nature
        n = names
        authors = if n.size == 1 then n[0]
                  elsif n.size <= 5 then "#{n[0...-1].join(", ")} & #{n[-1]}"
                  else "#{n[0]} et al."
                  end
        source = if @volume
                   "#{@journal} #{@volume}, #{pages("–")} (#{@year})."
                 else
                   "#{@journal}#{" #{@url}" if @url} (#{@year})."
                 end
        [sentence(authors), sentence(@title), source].join(" ")
      end

      def tex(text)
        text.to_s.gsub(/[\\{}&%$#_~^]/) { |c| TEX[c] }
      end

      def bibtex
        fields = [["author", @authors.map { |s, i| i.empty? ? tex(s) : "#{tex(s)}, #{tex(i)}" }.join(" and ")],
                  ["title", "{#{tex(@title)}}"],       # inner braces keep its capitals
                  [@chapter ? "booktitle" : "journal", tex(@journal)],
                  ["year", @year],
                  ["volume", @volume],
                  ["number", @issue && tex(@issue)],
                  ["pages", @first && pages("--")],
                  ["doi", @doi],
                  ["url", (@url unless @doi)]]
        body = fields.select { |_, v| v && !v.empty? }.map { |k, v| "  #{k} = {#{v}}," }
        "@#{@chapter ? "incollection" : "article"}{#{@key},\n#{body.join("\n")}\n}\n"
      end

      def ris
        lines = [["TY", @chapter ? "CHAP" : "JOUR"]]
        lines += names.map { |n| ["AU", n] }
        lines += [["TI", @title], ["T2", @journal], ["PY", @year], ["VL", @volume], ["IS", @issue],
                  ["SP", @first], ["EP", @last], ["DO", @doi], ["UR", @url]]
        lines.select { |_, v| v && !v.empty? }.map { |k, v| "#{k}  - #{v}\n" }.join + "ER  - \n"
      end

      def endnote
        lines = [["%0", @chapter ? "Book Section" : "Journal Article"]]
        lines += names.map { |n| ["%A", n] }
        lines += [["%T", @title], [@chapter ? "%B" : "%J", @journal], ["%D", @year], ["%V", @volume],
                  ["%N", @issue], ["%P", @first && pages("-")], ["%R", @doi], ["%U", @url]]
        lines.select { |_, v| v && !v.empty? }.map { |k, v| "#{k} #{v}\n" }.join
      end
    end
  end
end
