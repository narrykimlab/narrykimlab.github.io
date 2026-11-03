---
title: "Publications"
layout: gridlay
excerpt: "Papers from the Narry Kim lab on microRNA biogenesis, mRNA tails, viral RNAs and RNA therapeutics, by year."
permalink: /publications/
---

# Publications

<div class="chip-row" markdown="0">
<a class="chip" href="{{ site.baseurl }}/publications/" aria-current="page">By year</a>
<a class="chip" href="{{ site.baseurl }}/publications/by-topic/">By topic</a>
<a class="chip" href="{{ site.baseurl }}/publications/by-journal/">By journal</a>
</div>
<p class="publication-key" markdown="0"><span><sup>1</sup> Co-first author</span> <span><sup aria-hidden="true">&#9993;&#xFE0E;</sup> Corresponding author</span></p>

{%- comment -%}
  _data/publist.yml is newest first, so group_by gives the years newest first too.
  Each paper is the anchor #paper-<its cite_id>, which the Research page's
  cards link their journal to (_includes/research_papers.html); it is here
  only, as the topic page lists a paper under each of its topics.
{%- endcomment %}
{%- assign years = site.data.publist | group_by: "year" %}
{%- for year in years %}
<h2 class="pub-group" id="y{{ year.name }}">{{ year.name }}</h2>
<div class="publication-list" markdown="0">
{%- for publi in year.items %}
<p id="paper-{{ publi.cite_id }}">{% include publication_entry.html %}</p>
{%- endfor %}
</div>
{%- endfor %}

{% include publication_extras.html %}

{% include cite_dialog.html %}
