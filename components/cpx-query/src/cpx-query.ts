interface QueryFilter {
  name: string;
  key: string;
  facet: string;
  group: string;
  count: string;
  active: boolean;
  value: any;
}

export class CPXQuery extends HTMLElement {
  static get tag() {
    return "cpx-query";
  }
  _template;
  get template() {
    return this._template;
  }
  set template(val) {
    if (this._template === val) return;
    this._template = val;
  }
  _auto = false;
  _ready: boolean;
  get ready() {
    return this._ready;
  }
  set ready(val) {
    if (this._ready === val) return;
    this._ready = val;
    this.setAttribute("ready", this._ready.toString());
  }
  _cache: RequestCache = "default";
  _filters = { term: "", facets: {} };
  _activeFilters: Map<string, Set<string>> = new Map();
  _limit = 10;
  _from = 0;
  _sort = "relevance";
  _results;
  _term;
  _url;
  _valid = true;
  _mapper;

  get auto() {
    return this._auto;
  }
  set auto(val) {
    if (typeof val === "string") {
      val = true;
    }
    if (val === null) {
      val = false;
    }
    if (this._auto === val) {
      return;
    } else {
      this._auto = val;
      if (this._auto) {
        this.setAttribute("auto", "");
      } else {
        this.removeAttribute("auto");
      }
    }
  }
  get cache() {
    return this._cache;
  }
  set cache(val) {
    if (this._cache === val) return;
    this._cache = val;
    this.setAttribute("cache", this._cache);
  }
  get filters() {
    return this._filters;
  }

  set filters(val) {
    if (this._filters === val) return;
    this._filters = val;
  }

  get activeFilters() {
    return this._activeFilters;
  }

  set activeFilters(val) {
    if (this._activeFilters === val) return;
    this._activeFilters = val;
    this.filters.facets = this._activeFilters;
  }

  get from() {
    return this._from;
  }
  set from(val) {
    if (this._from === val) return;
    this._from = val;
    this.setAttribute("from", val.toString());
  }

  get limit() {
    return this._limit;
  }
  set limit(val) {
    if (this._limit === val) return;
    this._limit = val;
    this.setAttribute("limit", val.toString());
  }

  get sort() {
    return this._sort;
  }
  set sort(val) {
    if (this._sort === val) return;
    this._sort = val;
    this.setAttribute("sort", val);
  }

  get results() {
    return this._results;
  }
  set results(val) {
    if (this._results === val) return;
    this._results = val;
    this.from = this._results ? this.from + this.results.length : 0;
    let evt = {
      detail: {
        term: this.term,
        filters: this.activeFilters,
        facets: this._results.facet_counts || {},
        sort: this.sort,
        limit: this.limit,
        from: this.from,
        results: this._results,
      },
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent("query-complete", evt));
    if (this.template) {
      this.render();
    }
  }

  get term() {
    return this._term;
  }

  set term(val) {
    if (this._term === val) return;
    this._term = val;
    this.filters.term = this._term;
    this.setAttribute("term", val.toString());
  }

  get url() {
    try {
      return new URL(this._url);
    } catch {
      return new URL(this._url, window.location.href + "/");
    }
  }

  set url(val) {
    if (this._url === val) return;
    this._url = val;
    this.setAttribute("url", val.toString());
  }

  get valid() {
    return this._valid;
  }
  set valid(val) {
    if (this._valid === val) return;
    this._valid = val;
  }

  filterString(facets) {
    var len = facets.length,
      filterArr = [];
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < facets[i].items.length; j++) {
        if (facets[i].items[j].active) {
          let idx = 0;
          while (idx < facets[i].items[j].value.length) {
            filterArr.push(facets[i].items[j].value[idx]);
            idx = idx + 1;
          }
        }
      }
    }
    return filterArr.join(", ");
  }

  constructor() {
    super();
    let tmpl = this.querySelector("template");
    if (tmpl) {
      this.attachShadow({ mode: "open" });
      this.template = tmpl.cloneNode(true);
      this.prepTemplate();
    } else if (this.getAttribute("template")) {
      this.attachShadow({ mode: "open" });
      this.template = top.document.querySelector(this.getAttribute("template"))
        .cloneNode(true);
      this.prepTemplate();
    }

    this._changeAttr = this._changeAttr.bind(this);
  }

  connectedCallback() {
    top.addEventListener("params-ready", this._changeAttr);
    top.addEventListener("term-change", this._changeAttr);
    top.addEventListener("filter-item-change", this._changeAttr);
    top.addEventListener("sort-change", this._changeAttr);
    top.addEventListener("clear-filters", this._changeAttr);
    top.addEventListener("load-more", this._changeAttr);
    if (this.auto) this.search();
  }

  static get observedAttributes() {
    return ["term", "sort", "limit", "results", "url", "auto", "cache"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    this[name] = newVal;
  }

  _setFilters(item: QueryFilter) {
    let add = item.active;

    if (add) {
      if (this.activeFilters.has(item.group)) {
        this.activeFilters.get(item.group).add(item.key);
      } else {
        this.activeFilters.set(item.group, new Set([item.key]));
      }
      // this.activeFilters[item.group] = this.activeFilters[item.group] || [];
      // this.activeFilters[item.group].push(item.key);
    } else {
      if (this.activeFilters.has(item.group)) {
        this.activeFilters.get(item.group).delete(item.key);
        if (this.activeFilters.get(item.group).size === 0) {
          this.activeFilters.delete(item.group);
        }
      }
      // Object.keys(this.activeFilters).forEach(group => {
      //     if (group === item.group) {
      //         let idx = this.activeFilters[group].indexOf(item.key);
      //         if (idx >= 0) {
      //             this.activeFilters[group].splice(idx, 1);
      //             if (this.activeFilters[group].length === 0) {
      //                 delete this.activeFilters[group];
      //             }
      //         }
      //     }
      // });
    }
  }

  _changeAttr(e) {
    // console.log(e);
    switch (e.type) {
      case "term-change":
        if (e.detail && e.detail.term && e.detail.term.length > 0) {
          this.term = e.detail.term;
        } else {
          this.term = "";
        }
        this.from = 0;
        this.search();

        break;
      case "filter-item-change": //detail.facet
        if (e.detail && e.detail.facet) {
          this._setFilters(e.detail.facet);
        }
        this.from = 0;
        this.search();
        // Wait for params-ready event
        break;
      case "sort-change": // detail.sort
        if (e.detail && e.detail.sort) {
          this.sort = e.detail.sort;
        }
        this.from = 0;
        this.search();
        break;
      case "load-more": // detail.qty
        this.search();
        break;
      case "clear-filters":
        this.activeFilters.clear();
        this.search();
        break;
      case "params-ready":
        if (e.detail && e.detail.term) {
          this.term = e.detail.term;
        }
        if (e.detail && e.detail.sort) {
          this.sort = e.detail.sort;
        }
        if (e.detail && e.detail.filters) {
          this.activeFilters = e.detail.filters;
        }

        this.from = 0;
        if (
          this.activeFilters.size > 0 || e.detail.term !== null ||
          e.detail.sort !== null || e.detail.qty !== null
        ) {
          this.search();
        }
        break;
    }
  }

  search() {
    let evt = { bubbles: true, composed: true };
    this.dispatchEvent(new CustomEvent("query-start", evt));
    if (
      this.url &&
        ((this.activeFilters && this.activeFilters.size > 0) ||
          (this.term !== null && this.term !== "" &&
            typeof this.term !== "undefined")) || this.auto
    ) {
      let qURL = new URL(this.url.href) ||
        new URL(this.url.href, window.location.href + "/");
      // qURL.searchParams.set('tags_or_logic', 'true');
      // qURL.searchParams.set('filter_out_excluded', 'true');
      // qURL.searchParams.set('start', this.from.toString());
      // TODO: figure out the sorting
      // if (this.sort === 'most-recent') {
      //     qURL.searchParams.set('newFirst', 'true');
      // }
      // qURL.searchParams.set('q', this.term || '');
      // qURL.searchParams.set('hl', 'true');
      // qURL.searchParams.set('hl.fl', 'description');
      // qURL.searchParams.set('rows', this.limit.toString());
      // qURL.searchParams.set('start', (this.from + this.limit).toString());

      this.activeFilters.forEach((filters, group) => {
        qURL.searchParams.set(group, Array.from(filters).join(","));
      });
      // Object.keys(this.filters.facets).forEach(group => {
      //     this.filters.facets[group].forEach(facet => {
      //          facetQuery[group] = top.document.querySelector(`dp-search-filter-item[group=${group}][key=${facet}]`).getAttribute('type').replace(',', ' OR ')
      //     });
      // });
      // console.log(this.activeFilters);
      // qURL.searchParams.set('fq', facetQuery.);
      //facetQuery // map reduce??
      const queryInit: RequestInit = {
        cache: this.cache,
      };
      fetch(qURL.toString(), queryInit) //this.urlTemplate`${this.url}${this.term}${this.from}${this.limit}${this.sort}${this.filters}`)
        .then((resp) => resp.json())
        .then((data) => {
          let msgData;
          if (typeof data.length === "number") {
            msgData = new Map<any, any>(data.entries());
            msgData.set("length", data.length);
          } else {
            msgData = new Map<any, any>(Object.entries(data));
          }
          this.results = msgData;
        });
    } else {
      let evt = { detail: { invalid: true }, bubbles: true, composed: true };
      this.dispatchEvent(new CustomEvent("query-complete", evt));
    }
  }

  prepTemplate() {
    let repeatEls = this.template.content.querySelectorAll("[data-repeat]");
    let varMatch = /\${([^{]+[^}])}/g;
    if (repeatEls.length > 0) {
      repeatEls.forEach((el) => {
        let dr = el.getAttribute("data-repeat");
        if (dr.length === 0) {
          let drtxt = btoa(el.innerHTML.trim());
          el.setAttribute("data-repeat", drtxt);
          while (el.firstChild) el.removeChild(el.firstChild);
        }
      });
    }
    //this.template.innerHTML = this.template.innerHTML.replaceAll(/\${([^{]+[^}])}/g,'<var data-val="$1"></var>');
    if (!this.shadowRoot.firstChild) {
      //while (this.shadowRoot.firstChild) { this.shadowRoot.removeChild(this.shadowRoot.firstChild); }
      this.shadowRoot.appendChild(this.template.content.cloneNode(true));
      this.ready = true;
    }
  }

  renderTemplate(data, ele?) {
    let eltmpl;
    let matches;
    if (ele.getAttribute) {
      eltmpl = ele.getAttribute("data-repeat");
    }
    if (eltmpl) {
      matches = [...atob(eltmpl).matchAll(/\${([^{]+[^}])}/g)];
      data.forEach((v, k) => {
        if (Number.isInteger(k)) {
          let html = matches.reduce((a, c) => {
            let dataVal = c[1].split(".");
            return a.replaceAll(
              c[0],
              dataVal.length <= 1
                ? v[c[1]]
                : dataVal.reduce((acc, curr) => acc[curr], v),
            );
          }, atob(eltmpl));
          ele.innerHTML += html;
        }
      });
    } else {
      matches = [...ele.innerHTML.matchAll(/\${([^{]+[^}])}/g)];
      data.forEach((v, k) => {
        if (!Number.isInteger(k)) {
          let html = matches.reduce((a, c) => {
            let dataVal = c[1].split(".");
            return dataVal[0] == k
              ? a.replaceAll(
                c[0],
                dataVal.length <= 1
                  ? v
                  : dataVal.reduce((acc, curr) => acc[curr] || acc, v),
              )
              : a;
          }, ele.innerHTML);
          ele.innerHTML = html;
        }
      });
    }
  }

  render() {
    if (this.results) {
      let repeatEls = this.shadowRoot.querySelectorAll("[data-repeat]");
      if (repeatEls.length > 0) {
        repeatEls.forEach((el) => {
          while (el.firstChild) el.removeChild(el.firstChild);
          this.renderTemplate(this.results, el);
        });
      }
      this.renderTemplate(this.results, this.shadowRoot);
    }
  }
}
window.customElements.define(CPXQuery.tag, CPXQuery);
