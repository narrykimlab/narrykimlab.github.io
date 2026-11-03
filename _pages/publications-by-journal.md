---
title: "Publications by journal"
layout: gridlay
excerpt: "Papers from the Narry Kim lab, grouped by journal."
permalink: /publications/by-journal/
---

# Publications

<div class="chip-row" markdown="0">
<a class="chip" href="{{ site.baseurl }}/publications/">By year</a>
<a class="chip" href="{{ site.baseurl }}/publications/by-topic/">By topic</a>
<a class="chip" href="{{ site.baseurl }}/publications/by-journal/" aria-current="page">By journal</a>
</div>
<p class="publication-key" markdown="0"><span><sup>1</sup> Co-first author</span> <span><sup>*</sup> Co-corresponding author</span></p>

{%- comment -%}
  Journals in alphabetical order, whatever the case ("Science" before "STAR
  Protocols"), each one's papers newest first (the order of
  _data/publist.yml).
{%- endcomment %}
{%- assign journals = site.data.publist | group_by: "journal" | sort_natural: "name" %}
{%- for journal in journals %}
<h2 class="pub-group pub-journal" id="{{ journal.name | slugify }}">{{ journal.name }}</h2>
<div class="publication-list" markdown="0">
{%- for publi in journal.items %}
<p>{% include publication_entry.html %}</p>
{%- endfor %}
</div>
{%- endfor %}

{% include publication_extras.html %}

{% include cite_dialog.html %}
