=begin
  Jekyll filters for a site-local script: `sri` produces its Subresource
  Integrity hash, and `fingerprint` a short digest of its contents to put in
  its URL, so that a changed file has a new address.
  Usage:
    <script src="/js/site.js?v={{ '/js/site.js' | fingerprint }}" integrity="{{ '/js/site.js' | sri }}" defer></script>
  The digests are taken from the file on disk at build time, so they can never
  drift out of sync with the asset the way a hand-written hash would.

  The fingerprint matters because of the integrity check: a browser that still
  holds the old file in its cache (GitHub Pages lets it keep one for ten
  minutes; `jekyll serve` sets no limit at all) finds it does not match the new
  page's hash and refuses to run it. With the digest in the URL, a new file is
  a new URL, which no cache holds yet.
=end
require "base64"
require "digest"

module Jekyll
  module SriFilter
    def sri(path)
      "sha384-" + Base64.strict_encode64(Digest::SHA384.digest(asset_bytes(path, "sri")))
    end

    def fingerprint(path)
      Digest::SHA256.hexdigest(asset_bytes(path, "fingerprint"))[0, 12]
    end

    # The stylesheet is compiled from a .scss file and the partials in
    # _sass/, so its digest is taken over all of them: a change to any one is
    # a new URL for /css/main.css, which no cache holds yet.
    #   <link rel="stylesheet" href="/css/main.css?v={{ '/css/main.scss' | sass_fingerprint }}">
    def sass_fingerprint(path)
      source = @context.registers[:site].source
      partials = Dir.glob(File.join(source, "_sass", "**", "*.scss")).sort
      bytes = asset_bytes(path, "sass_fingerprint") + partials.map { |f| File.binread(f) }.join
      Digest::SHA256.hexdigest(bytes)[0, 12]
    end

    private

    def asset_bytes(path, filter)
      source = @context.registers[:site].source
      file = File.join(source, path.sub(%r{\A/}, ""))
      unless File.file?(file)
        raise "#{filter} filter: no such file: #{file} (referenced as #{path})"
      end
      File.binread(file)
    end
  end
end

Liquid::Template.register_filter(Jekyll::SriFilter)
