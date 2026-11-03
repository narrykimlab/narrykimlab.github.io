=begin
  Fails the build when a _data/ file holds a mistake the templates would
  otherwise render quietly wrong: an author `link` with no team.yml entry
  links to a missing page, an unknown team `category` drops the member from
  the people page, `active: "false"` (a string) counts as true in Liquid, a
  publication out of year order splits its year in two on /publications/,
  and so on.

  Every problem is collected and reported at once, so one build lists them all.
  Each rule here mirrors what a template relies on; when a template changes
  what it reads, change the rule with it.
=end
require "date"

module Jekyll
  module DataCheck
    # The groups _pages/people.md lists; any other category is never shown.
    TEAM_CATEGORIES = %w[principal-investigator postdoc student research-assistant support].freeze
    MONTHS = Date::MONTHNAMES.compact.freeze
    # A publication's volume, issue and pages, as the citations
    # (_plugins/citations.rb) take them apart: "84(9):1764-1782.e10",
    # "12:6026" (an article number), "41(D1):D252-D257".
    VIP = /\A[0-9]+(\([^():]+\))?:[A-Za-z]*[0-9]+(-[A-Za-z]*[0-9]+)?(\.e[0-9]+)?\z/

    class Checker
      def initialize(site)
        @site = site
        @data = site.data
        @problems = []
      end

      # Mistakes the templates would get round, but which should not go
      # unnoticed: reported in the build's output, without stopping it.
      attr_reader :warnings

      def run
        @warnings = []
        team_links = check_team
        alumni_names = check_alumni_members
        check_publications("publist", team_links, alumni_names)
        check_publications("chapters", team_links, alumni_names)
        check_topics
        list("patents").each_with_index { |p, i| require_fields("patents", p, i, "title") }
        check_news
        check_photos
        check_icons
        @problems
      end

      private

      def locate(file, entry, index)
        label = entry.is_a?(Hash) && (entry["name"] || entry["title"] || entry["date"])
        where = label ? "entry #{index + 1} (#{label.to_s[0, 60]})" : "entry #{index + 1}"
        "_data/#{file}.yml, #{where}"
      end

      def problem(file, entry, index, message)
        @problems << "#{locate(file, entry, index)}: #{message}"
      end

      def warning(file, entry, index, message)
        @warnings << "#{locate(file, entry, index)}: #{message}"
      end

      def list(file)
        value = @data[file]
        return value if value.is_a?(Array)
        @problems << "_data/#{file}.yml: expected a list of entries" unless value.nil?
        []
      end

      def require_fields(file, entry, index, *fields)
        fields.each do |field|
          value = entry[field]
          problem(file, entry, index, "missing `#{field}`") if value.nil? || value.to_s.strip.empty?
        end
      end

      def source_file?(path)
        File.file?(File.join(@site.source, path))
      end

      def member_page?(link)
        source_file?("_pages/people/#{link}.md")
      end

      # A member without `link` has no profile: their card is not a link, and
      # no author can point at them.
      def check_team
        links = {}
        @team_names = {}
        list("team").each_with_index do |m, i|
          @team_names[m["name"]] = m["link"] if m.is_a?(Hash)
          require_fields("team", m, i, "name", "category", "sort-key", "photo", "info")
          unless [true, false].include?(m["active"])
            problem("team", m, i, "`active` must be true or false, not #{m["active"].inspect}")
          end
          if m["category"] && !TEAM_CATEGORIES.include?(m["category"])
            problem("team", m, i, "unknown category #{m["category"].inspect} (one of: #{TEAM_CATEGORIES.join(", ")})")
          end
          if (link = m["link"])
            problem("team", m, i, "link #{link.inspect} is used by an earlier entry too") if links.key?(link)
            problem("team", m, i, "no profile page _pages/people/#{link}.md") unless member_page?(link)
            links[link] = true
          end
          if m["photo"] && !source_file?("images/members/#{m["photo"]}")
            problem("team", m, i, "photo images/members/#{m["photo"]} does not exist")
          end
        end
        links
      end

      # /publications/ groups entries by year as they come, so a year out of
      # order would be printed twice.
      def check_publications(file, team_links, alumni_names)
        previous = nil
        list(file).each_with_index do |p, i|
          require_fields(file, p, i, "title", "journal")
          %w[url supplement].each do |field|
            next if p[field].nil? || p[field].to_s.match?(%r{\Ahttps?://})
            problem(file, p, i, "`#{field}` must be a full http(s) address")
          end
          if p.key?("vip") && !p["vip"].to_s.match?(VIP)
            problem(file, p, i, "`vip` #{p["vip"].inspect} is not volume(issue):pages, like " \
                                "\"84(9):1764-1782.e10\" or \"12:6026\", with the last page in full")
          end
          year = p["year"]
          if !year.is_a?(Integer)
            problem(file, p, i, "`year` must be a number")
          else
            problem(file, p, i, "year #{year} comes after #{previous}; keep newest first") if previous && year > previous
            previous = year
          end
          authors = p["authors"]
          unless authors.is_a?(Array) && !authors.empty?
            problem(file, p, i, "no `authors` list")
            next
          end
          authors.each_with_index do |a, j|
            unless a.is_a?(Hash) && a["name"].to_s.strip != ""
              problem(file, p, i, "author #{j + 1} needs a `name`")
              next
            end
            if a["link"] && !team_links.key?(a["link"])
              problem(file, p, i, "author #{j + 1} links to #{a["link"].inspect}, which is not a link in team.yml")
            end
            if a.key?("lab") && a["lab"] != true
              problem(file, p, i, "author #{j + 1}: `lab` is either true or left out")
            end
            check_full_name(file, p, i, a, j, alumni_names) if a.key?("full_name")
          end
          # Every paper has at least one corresponding author (each shown *).
          if file == "publist" && authors.none? { |a| a.is_a?(Hash) && a["is_corresponding"] == true }
            warning(file, p, i, "no corresponding author marked (`is_corresponding: true`)")
          end
        end
      end

      # A `full_name` is a link to a former member's entry on /people/ when it
      # is a name in alumni_members.yml. One that is not -- misspelt, or
      # someone never listed there -- is allowed, unlinked, with a warning.
      def check_full_name(file, p, i, a, j, alumni_names)
        name = a["full_name"]
        if !name.is_a?(String) || name.strip.empty?
          problem(file, p, i, "author #{j + 1} (#{a["name"]}): `full_name` must be a name")
        elsif a["lab"] != true
          problem(file, p, i, "author #{j + 1} (#{a["name"]}): `full_name` goes with `lab: true`")
        elsif @team_names[name]
          warning(file, p, i, "author #{j + 1} (#{a["name"]}): #{name} is a current member; " \
                              "give them `link: #{@team_names[name]}` instead of `full_name`")
        elsif !alumni_names.include?(name)
          warning(file, p, i, "author #{j + 1} (#{a["name"]}): full_name #{name.inspect} is not a name " \
                              "in alumni_members.yml, so it is not a link")
        end
      end

      # /publications/by-topic/ lists a paper under each topic it names, so a
      # paper with none, or only unknown ones, would be missing from it.
      def check_topics
        ids = []
        list("topics").each_with_index do |t, i|
          require_fields("topics", t, i, "id", "name")
          problem("topics", t, i, "id #{t["id"].inspect} is used by an earlier entry too") if ids.include?(t["id"])
          ids << t["id"]
        end
        list("publist").each_with_index do |p, i|
          topics = p["topics"]
          unless topics.is_a?(Array) && !topics.empty?
            problem("publist", p, i, "no `topics` list (one or more of: #{ids.join(", ")})")
            next
          end
          (topics - ids).each { |t| problem("publist", p, i, "unknown topic #{t.inspect} (one of: #{ids.join(", ")})") }
          problem("publist", p, i, "a topic is named twice") if topics.uniq.size < topics.size
          problem("publist", p, i, "`other` is for a paper no other topic fits; it goes alone") if topics.include?("other") && topics.size > 1
        end
      end

      # The people page lists them in file order; keep it most recently
      # departed first. Each is an anchor named after them, so no two names
      # may make the same one. Returns the names, for the authors' full_name.
      def check_alumni_members
        previous = nil
        names = []
        anchors = {}
        list("alumni_members").each_with_index do |m, i|
          require_fields("alumni_members", m, i, "name", "position")
          if m.is_a?(Hash) && m["name"].is_a?(String)
            names << m["name"]
            anchor = "alumni-#{Jekyll::Utils.slugify(m["name"])}"
            problem("alumni_members", m, i, "makes the same anchor (##{anchor}) as an earlier entry") if anchors.key?(anchor)
            anchors[anchor] = true
          end
          years = m["years"]
          unless years.is_a?(Array) && [1, 2].include?(years.size) && years.all?(Integer)
            problem("alumni_members", m, i, "`years` must be [first, last] or [last]")
            next
          end
          problem("alumni_members", m, i, "`years` ends before it starts") if years.size == 2 && years[1] < years[0]
          if previous && years.last > previous
            problem("alumni_members", m, i, "left in #{years.last}, after the entry above it; keep the latest first")
          end
          previous = years.last
        end
        names
      end

      # Dates are free text the templates print as is; requiring one of two
      # forms keeps them consistent and lets this check the newest-first order.
      def check_news
        previous = nil
        list("news").each_with_index do |n, i|
          require_fields("news", n, i, "date", "headline")
          text = n["date"].to_s
          date = if text.match?(/\A\d{4}\z/)
                   Date.new(text.to_i, 12, 31)   # a year alone sorts as its last day
                 else
                   begin
                     Date.strptime(text, "%b %d, %Y")
                   rescue Date::Error
                     problem("news", n, i, "date #{text.inspect} is not like \"Feb 26, 2025\" or \"2025\"")
                     nil
                   end
                 end
          next unless date
          if previous && date.year > previous.year
            problem("news", n, i, "dated after the entry above it; keep newest first")
          end
          previous = date
        end
      end

      def check_photos
        list("photos").each_with_index do |p, i|
          require_fields("photos", p, i, "period", "date")
          unless p["date"].to_s.match?(/\A(#{MONTHS.join("|")}) \d{4}\z/)
            problem("photos", p, i, "date #{p["date"].inspect} is not like \"May 2025\"")
          end
          file = p["youtube"] ? p["thumb"] : p["photo"]
          if p["youtube"] && p["photo"]
            problem("photos", p, i, "has both `youtube` and `photo`; a video's picture is `thumb`")
          elsif file.nil?
            problem("photos", p, i, p["youtube"] ? "a video needs a `thumb`" : "needs a `photo` or a `youtube` id")
          elsif !source_file?("images/photos/#{file}")
            problem("photos", p, i, "images/photos/#{file} does not exist")
          end
        end
      end

      # _includes/icon.html renders an empty <svg> for an unknown name, so check
      # the names the templates ask for as well as the entries themselves.
      def check_icons
        icons = @data["icons"] || {}
        icons.each do |name, icon|
          box = icon.is_a?(Hash) ? icon["viewbox"].to_s.split : []
          unless box.size == 4 && box.all? { |n| n.match?(/\A\d+(\.\d+)?\z/) } && icon["path"].to_s.start_with?("M")
            @problems << "_data/icons.yml, #{name}: needs a `viewbox` of four numbers and a `path`"
          end
        end
        Dir.glob(File.join(@site.source, "{_includes,_layouts,_pages}", "**", "*.{html,md}")).sort.each do |file|
          File.read(file).scan(/include icon\.html name="([^"]+)"/).flatten.uniq.each do |name|
            next if icons.key?(name)
            @problems << "#{file.delete_prefix("#{@site.source}/")}: icon #{name.inspect} is not in _data/icons.yml"
          end
        end
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  checker = Jekyll::DataCheck::Checker.new(site)
  problems = checker.run
  checker.warnings.each { |w| Jekyll.logger.warn "Data check:", w }
  next if problems.empty?
  problems.each { |p| Jekyll.logger.error "Data check:", p }
  raise Jekyll::Errors::FatalException,
        "#{problems.size} problem(s) in _data/ -- see the Data check lines above"
end
