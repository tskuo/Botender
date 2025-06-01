import { e as error, f as fail } from "../../../../chunks/index2.js";
import "clsx";
import "../../../../chunks/client.js";
import "ts-deepmerge";
import { a as parseRequest, m as mergeDefaults, b as mapErrors, r as replaceInvalidDefaults, c as zod, p as playgroundRunFormSchema } from "../../../../chunks/zod.js";
import "memoize-weak";
async function superValidate(data, adapter, options) {
  if (data && "superFormValidationLibrary" in data) {
    options = adapter;
    adapter = data;
    data = void 0;
  }
  const validator = adapter;
  const defaults = options?.defaults ?? validator.defaults;
  const jsonSchema = validator.jsonSchema;
  const parsed = await parseRequest(data, jsonSchema, options);
  const addErrors = options?.errors ?? (options?.strict ? true : !!parsed.data);
  const parsedData = options?.strict ? parsed.data ?? {} : mergeDefaults(parsed.data, defaults);
  let status;
  if (!!parsed.data || addErrors) {
    status = await /* @__PURE__ */ validator.validate(parsedData);
  } else {
    status = { success: false, issues: [] };
  }
  const valid = status.success;
  const errors = valid || !addErrors ? {} : mapErrors(status.issues, validator.shape);
  const dataWithDefaults = valid ? status.data : replaceInvalidDefaults(options?.strict ? mergeDefaults(parsedData, defaults) : parsedData, defaults, jsonSchema, status.issues, options?.preprocessed);
  let outputData;
  if (jsonSchema.additionalProperties === false) {
    outputData = {};
    for (const key of Object.keys(jsonSchema.properties ?? {})) {
      if (key in dataWithDefaults)
        outputData[key] = dataWithDefaults[key];
    }
  } else {
    outputData = dataWithDefaults;
  }
  const output = {
    id: parsed.id ?? options?.id ?? validator.id,
    valid,
    posted: parsed.posted,
    errors,
    data: outputData
  };
  if (!parsed.posted) {
    output.constraints = validator.constraints;
    if (Object.keys(validator.shape).length) {
      output.shape = validator.shape;
    }
  }
  return output;
}
const load = async ({ fetch }) => {
  try {
    const resTasks = await fetch("/api/tasks");
    const tasks = await resTasks.json();
    return {
      tasks,
      form: await superValidate(zod(playgroundRunFormSchema))
    };
  } catch {
    throw error(404, "Fail to fetch tasks.");
  }
};
const actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const form = await superValidate(formData, zod(playgroundRunFormSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    console.log(formData.get("playgroundTasks"));
    console.log(form.data.channel);
    return {
      form
    };
  }
};
export {
  actions,
  load
};
