=begin
  Leaves out of the site the profile page of every member whose team.yml
  entry has `has_profile: false`: _pages/people/<link>.md stays in the
  repository (and on the Notion page members edit), so setting the flag back
  to true brings the page back as it was, but nothing is written to
  /people/<link>, which is then a 404, and the sitemap does not list it.
  The templates that link to profiles (_includes/team_list.html,
  team_lead.html, publication_author_name.html) read the same flag, so
  nothing links to a page that is not there.

  Runs after the site is read, before any generator (jekyll-sitemap among
  them) sees the pages.
=end

Jekyll::Hooks.register :site, :post_read do |site|
  hidden = Array(site.data["team"])
           .select { |m| m.is_a?(Hash) && m["link"] && m["has_profile"] == false }
           .map { |m| "_pages/people/#{m["link"]}.md" }
  next if hidden.empty?

  site.pages.reject! { |page| hidden.include?(page.relative_path) }
end
