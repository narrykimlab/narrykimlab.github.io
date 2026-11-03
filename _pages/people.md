---
title: "People"
layout: gridlay
excerpt: "The people of the Narry Kim lab at the Institute for Basic Science and Seoul National University, with our former members."
permalink: /people/
---

# People

{% include team_lead.html %}

## Members

{% assign selected_categories = "postdoc,student,research-assistant,support" | split:',' %}
{% include team_list.html order="monthly" %}

## Former members

{%- comment -%}
  In the order of _data/alumni_members.yml, most recently departed first.
  A name links to an outside page about the person where there is one.
  Each entry is an anchor, #alumni-<the name, slugified>, which the author
  lists of the publications link to (_includes/publication_author_list.html).
{%- endcomment %}

<div class="alumni-list" markdown="0">
{%- for person in site.data.alumni_members %}
<div class="alumni-item" id="alumni-{{ person.name | slugify }}">
<div class="alumni-name">{% if person.url %}<a href="{{ person.url }}">{{ person.name }}</a>{% else %}{{ person.name }}{% endif %}</div>
<div>{{ person.position }}, {% if person.years.size > 1 %}{{ person.years[0] }}–{{ person.years[1] }}{% else %}{{ person.years[0] }}{% endif %}</div>
{%- if person.current %}
<div class="alumni-now"><span>Now</span> {{ person.current }}</div>
{%- endif %}
</div>
{%- endfor %}
</div>
