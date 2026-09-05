/**
 * Converts Shopify rich_text schema (JSON) to HTML.
 *
 * @param schema - The rich text schema object or JSON string.
 * @param options - Conversion options.
 * @param options.scoped - A string for a CSS class name or `true` to use the default ("rte").
 * @param options.classes - Optional mapping of tag names to CSS class names.
 * @param options.newLineToBreak - If true, converts newlines in plain text to <br>.
 * @returns The resulting HTML string.
 */
export function renderRichText(
  schema: any,
  options: {
    scoped?: string | boolean;
    classes?: Record<string, string>;
    newLineToBreak?: boolean;
  } = {}
): string {
  let { scoped, classes, newLineToBreak } = options;
  let html = "";

  // If schema is a JSON string, parse it.
  if (typeof schema === "string") {
    try {
      schema = JSON.parse(schema);
    } catch (error) {
      console.error("Error parsing rich text schema:", error);
      return schema; // fallback: return the original string
    }
  }

  // Allow options itself to be provided as a simple value for scoped
  if (typeof options === "string" || typeof options === "boolean") {
    scoped = options;
  }

  // If schema is the root object with children
  if (
    schema &&
    schema.type === "root" &&
    Array.isArray(schema.children) &&
    schema.children.length > 0
  ) {
    if (scoped) {
      const className = scoped === true ? "rte" : scoped;
      html += `<div class="${className}">${renderRichText(
        schema.children,
        options
      )}</div>`;
    } else {
      html += renderRichText(schema.children, options);
    }
  } else if (Array.isArray(schema)) {
    // Iterate over each element in the array
    for (const el of schema) {
      switch (el.type) {
        case "paragraph":
          html += buildParagraph(el, options);
          break;
        case "heading":
          html += buildHeading(el, options);
          break;
        case "list":
          html += buildList(el, options);
          break;
        case "list-item":
          html += buildListItem(el, options);
          break;
        case "link":
          html += buildLink(el, options);
          break;
        case "text":
          html += buildText(el, options);
          break;
        default:
          break;
      }
    }
  }
  return html;
}

function getClass(
  tag: string,
  classes?: Record<string, string>
): string | null {
  if (classes && classes[tag]) {
    return classes[tag];
  }
  return null;
}

function outputAttributes(attributes: Record<string, any>): string {
  if (!attributes) return "";
  return Object.keys(attributes)
    .filter((key) => attributes[key])
    .map((key) => ` ${key}="${attributes[key]}"`)
    .join("");
}

function createElement(
  tag: string,
  classes: Record<string, string> | undefined,
  content: string,
  attributes: Record<string, any> = {}
): string {
  const className = getClass(tag, classes);
  if (className) {
    attributes = { ...attributes, class: className };
  }
  return `<${tag}${outputAttributes(attributes)}>${content}</${tag}>`;
}

function buildParagraph(el: any, options: any): string {
  const { classes } = options;
  return createElement("p", classes, renderRichText(el?.children, options));
}

function buildHeading(el: any, options: any): string {
  const { classes } = options;
  const tag = `h${el?.level || 1}`;
  return createElement(tag, classes, renderRichText(el?.children, options));
}

function buildList(el: any, options: any): string {
  const { classes } = options;
  const tag = el?.listType === "ordered" ? "ol" : "ul";
  return createElement(tag, classes, renderRichText(el?.children, options));
}

function buildListItem(el: any, options: any): string {
  const { classes } = options;
  return createElement("li", classes, renderRichText(el?.children, options));
}

function buildLink(el: any, options: any): string {
  const { classes } = options;
  const attributes = {
    href: el?.url,
    title: el?.title,
    target: el?.target,
  };
  return createElement(
    "a",
    classes,
    renderRichText(el?.children, options),
    attributes
  );
}

function buildText(el: any, options: any): string {
  const { classes, newLineToBreak } = options;
  if (el?.bold && el?.italic) {
    return createElement(
      "strong",
      classes,
      createElement("em", classes, el?.value)
    );
  } else if (el?.bold) {
    return createElement("strong", classes, el?.value);
  } else if (el?.italic) {
    return createElement("em", classes, el?.value);
  } else {
    return newLineToBreak
      ? el?.value?.replace(/\n/g, "<br>") || ""
      : el?.value || "";
  }
}
