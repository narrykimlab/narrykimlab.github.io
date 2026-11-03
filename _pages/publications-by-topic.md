---
title: "Publications by topic"
layout: gridlay
excerpt: "Papers from the Narry Kim lab, grouped by research topic."
permalink: /publications/by-topic/
---

# Publications

<div class="chip-row" markdown="0">
<a class="chip" href="{{ site.baseurl }}/publications/">By year</a>
<a class="chip" href="{{ site.baseurl }}/publications/by-topic/" aria-current="page">By topic</a>
<a class="chip" href="{{ site.baseurl }}/publications/by-journal/">By journal</a>
</div>
<p class="publication-key" markdown="0"><span><sup>1</sup> Co-first author</span> <span><sup>*</sup> Co-corresponding author</span></p>

{%- comment -%}
  The topics in the order of _data/topics.yml, each one's papers newest
  first (the order of _data/publist.yml). A paper with several topics is
  listed under each. Beside them, the topics as links to their headings,
  with the number of papers in each; on a wide screen it stays in view and
  marks the topic being read (js/site.js).
{%- endcomment %}
<div class="topic-layout" markdown="0">
<nav class="topic-nav" aria-labelledby="topic-nav-label">
<p id="topic-nav-label">Topics</p>
<ul>
{%- for topic in site.data.topics %}
{%- assign papers = site.data.publist | where_exp: "p", "p.topics contains topic.id" %}
<li><a href="#{{ topic.id }}">{{ topic.name }} <span class="topic-count">{{ papers.size }}<span class="sr-only"> papers</span></span></a></li>
{%- endfor %}
</ul>
</nav>
<div class="topic-sections">
{%- for topic in site.data.topics %}
{%- assign papers = site.data.publist | where_exp: "p", "p.topics contains topic.id" %}
<h2 class="pub-group" id="{{ topic.id }}">{{ topic.name }}</h2>
<div class="publication-list">
{%- for publi in papers %}
<p>{% include publication_entry.html %}</p>
{%- endfor %}
</div>
{%- endfor %}

{% include publication_extras.html %}
</div>
</div>

{% include cite_dialog.html %}
