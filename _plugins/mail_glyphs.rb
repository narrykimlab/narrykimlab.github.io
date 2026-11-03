=begin
  The site's email addresses are drawn, not written (_tools/mail-fonts.py).
  The `mail_glyphs` filter turns an address, or a piece of one, into the
  Private Use code points that the fonts fonts/NKLMail-*.woff2 draw as its
  characters, by the table in _data/mail_glyphs.yml; a reader sees the
  address, a program reading the HTML or the DOM sees characters that mean
  nothing. It fails the build on a character the table does not have.

    {{ "narrykim@snu.ac.kr" | mail_glyphs }}

  Two checks fail the build too:
  - js/site.js, which turns an address back into text for its mailto link
    and for copying, must hold the same table (MAIL_FIRST, MAIL_CHARACTERS);
  - no page may give an address away: what is written to _site may hold none
    of the addresses in _data/team.yml and the pages' front matter, and no
    mailto: link. An address in a page's text goes through
    _includes/email_link.html instead.
=end
module Jekyll
  module MailGlyphs
    SCRIPT = "js/site.js".freeze

    def self.table(site)
      data = site.data["mail_glyphs"] or
        raise Errors::FatalException, "Mail glyphs: _data/mail_glyphs.yml is missing"
      [Integer(data["first"]), data["characters"].to_s]
    end

    def mail_glyphs(text)
      first, characters = MailGlyphs.table(@context.registers[:site])
      text.to_s.each_char.map do |c|
        i = characters.index(c) or
          raise Errors::FatalException,
                "Mail glyphs: #{text.inspect} has #{c.inspect}, which the email fonts " \
                "do not draw (_data/mail_glyphs.yml lists what they do)"
        (first + i).chr(Encoding::UTF_8)
      end.join
    end

    # The addresses a page might give away: every one the site's data holds.
    def self.addresses(site)
      found = [site.config["email"]]
      found += Array(site.data["team"]).map { |m| m["email"] }
      found += (site.pages + site.documents).map { |d| d.data["email"] }
      found.compact.map(&:to_s).map(&:strip).reject(&:empty?).uniq
    end
  end
end

Liquid::Template.register_filter(Jekyll::MailGlyphs)

Jekyll::Hooks.register :site, :post_read do |site|
  first, characters = Jekyll::MailGlyphs.table(site)
  script = File.read(File.join(site.source, Jekyll::MailGlyphs::SCRIPT), encoding: "utf-8")
  js_first = script[/MAIL_FIRST = 0x(\h+);/, 1]
  js_characters = script[/MAIL_CHARACTERS = '([^']*)';/, 1]
  next if js_first && js_first.hex == first && js_characters == characters
  raise Jekyll::Errors::FatalException,
        "Mail glyphs: #{Jekyll::MailGlyphs::SCRIPT} must hold the table in " \
        "_data/mail_glyphs.yml (MAIL_FIRST = 0x#{format('%04X', first)}; " \
        "MAIL_CHARACTERS = '#{characters}';)"
end

Jekyll::Hooks.register :site, :post_render do |site|
  addresses = Jekyll::MailGlyphs.addresses(site)
  problems = (site.pages + site.documents).filter_map do |doc|
    output = doc.output.to_s
    given = addresses.select { |a| output.include?(a) }
    given << "a mailto: link" if output.match?(/mailto:/i)
    "#{doc.relative_path} gives away #{given.join(', ')}" unless given.empty?
  end
  next if problems.empty?
  problems.each { |p| Jekyll.logger.error "Mail glyphs:", p }
  raise Jekyll::Errors::FatalException,
        "#{problems.size} page(s) show an email address as text -- use " \
        "_includes/email_link.html or _includes/email_chip.html"
end
