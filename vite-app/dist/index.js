// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/tinydb_bridge.ts
import { spawn } from "child_process";
async function executeCommand(command, params = {}) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", ["server/tinydb_storage.py"]);
    let stdoutData = "";
    let stderrData = "";
    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });
    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`stderr: ${stderrData}`);
        return reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
      }
      try {
        const result = JSON.parse(stdoutData);
        if (!result.success) {
          return reject(new Error(result.error || "Unknown error"));
        }
        resolve(result.data);
      } catch (err) {
        console.error("Error parsing Python output:", err);
        console.error("Output was:", stdoutData);
        reject(err);
      }
    });
    pythonProcess.stdin.write(JSON.stringify({ command, params }));
    pythonProcess.stdin.end();
  });
}
async function getUser(id) {
  const result = await executeCommand("get_user", { id });
  return result || void 0;
}
async function getUserByUsername(username) {
  const result = await executeCommand("get_user_by_username", { username });
  return result || void 0;
}
async function createUser(user) {
  const result = await executeCommand("create_user", { user });
  if (!result) {
    throw new Error("Failed to create user");
  }
  return result;
}
async function createFormSubmission(submission) {
  const result = await executeCommand("create_form_submission", { submission });
  if (!result) {
    throw new Error("Failed to create form submission");
  }
  return result;
}
async function getAllFormSubmissions() {
  const result = await executeCommand("get_all_form_submissions");
  if (!result) {
    return [];
  }
  return result;
}

// server/storage.ts
var TinyDbStorage = class {
  async getUser(id) {
    return getUser(id);
  }
  async getUserByUsername(username) {
    return getUserByUsername(username);
  }
  async createUser(user) {
    return createUser(user);
  }
  async createFormSubmission(submission) {
    return createFormSubmission(submission);
  }
  async getAllFormSubmissions() {
    return getAllFormSubmissions();
  }
};
var storage = new TinyDbStorage();

// server/routes.ts
import multer from "multer";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  bpm: boolean("bpm").notNull().default(false),
  key: boolean("key").notNull().default(false),
  approachability: boolean("approachability").notNull().default(false),
  modelType: text("model_type").notNull(),
  // For radio selection: 'discogs-effnet', 'musicnn', 'magnatagatune'
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  submittedAt: text("submitted_at").notNull()
});
var insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true
});
var formValidationSchema = insertFormSubmissionSchema.extend({
  // Form validation schema (Vue-inspired approach)
  bpm: z.boolean(),
  key: z.boolean(),
  approachability: z.boolean(),
  modelType: z.enum(["discogs-effnet", "musicnn", "magnatagatune"]),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileType: z.string().optional().nullable(),
  faid: z.string(),
  submittedAt: z.string()
}).superRefine((data, ctx) => {
  console.log("Hello");
  console.log(data.fileName);
  if (data.fileName = "") {
    console.log("match filename is blank");
    ctx.addIssue({
      path: ["options"],
      code: z.ZodIssueCode.custom,
      message: "Please select a filename"
    });
  }
  if (!(data.bpm || data.key || data.approachability)) {
    ctx.addIssue({
      path: ["options"],
      code: z.ZodIssueCode.custom,
      message: "Please select at least one option"
    });
  }
});

// server/routes.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs";
import http from "http";
import FormData from "form-data";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";
var require2 = createRequire(import.meta.url);
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var maxFileSizeInBytes = 11e6;
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(mp3|wav|flac)\b/)) {
      req.fileValidationError = "{detail: Goes wrong on the extension}";
      return cb(null, false, new Error("Goes wrong on the extension"));
    }
    const fileSize = parseInt(req.headers["content-length"]);
    if (fileSize > maxFileSizeInBytes) {
      req.fileValidationError = "{detail: File too large}";
      return cb(null, false, new Error("File too large"));
    }
    if (file.mimetype !== "audio/mpeg") {
      req.fileValidationError = "{detail: goes wrong on the mimetype}";
      return cb(null, false, new Error("goes wrong on the mimetype"));
    }
    cb(null, true);
  }
});
var uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var start = async function start2(filename, tagobj) {
  console.log("In START");
  const buffer = fs.readFileSync(filename);
  console.log(filename);
  const form = new FormData();
  var model = JSON.stringify(tagobj);
  console.log(model);
  console.log(Buffer.from("Hello World").toString("base64"));
  form.append("tagselection", model, {
    contentType: "application/json",
    //contentType: 'application/octet-stream',
    //Content-Transfer-Encoding: base64,
    name: "tagselection",
    //tagobj: '{genre: true}',
    tagobj
  });
  form.append("file", buffer, {
    contentType: "multipart/form-data",
    name: "file",
    filename
    //name: 'tagselection',
    //tagobj: tagobj,
  });
  console.log("HEREEEEEEEEEEEEEEEEE");
  console.log(tagobj);
  let result;
  try {
    const response = await axios.post(
      "http://localhost:8000/upload",
      //formData,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    ).then(function(response2) {
      console.log("SUCCESS!!");
      result = response2;
      console.log("Result:", result);
      console.log(response2);
      console.log(response2.status);
    }).catch(function(error) {
      console.log("FAILURE!!");
      result = error;
      console.log(error);
    });
  } catch (error) {
    console.log("ERRORED START");
    console.log("I will execute after error");
    console.log("");
    console.log("Request failed:", error);
  }
  return result;
};
async function registerRoutes(app2) {
  app2.engine(".html", require2("ejs").__express);
  app2.set("view engine", "html");
  app2.set("views", path.join(__dirname, "views"));
  app2.use(express.static(path.join(__dirname, "..", "public")));
  app2.post("/api/form", upload.single("file"), async (req, res) => {
    try {
      const formData = {
        bpm: req.body.bpm === "true",
        key: req.body.key === "true",
        approachability: req.body.approachability === "true",
        modelType: req.body.modelType || "discogs-effnet",
        fileName: req.body.fileName || null,
        fileSize: req.body.fileSize ? parseInt(req.body.fileSize) : null,
        fileType: req.body.fileType || null,
        faid: "null",
        submittedAt: req.body.submittedAt
      };
      var tagobj = {
        tags: {}
      };
      const validatedData = formValidationSchema.parse(formData);
      if (formData.bpm === true) {
        console.log("Setting BPM");
        tagobj.tags.bpm = true;
      }
      if (formData.key === true) {
        console.log("Setting Key");
        tagobj.tags.key = true;
      }
      if (formData.approachability === true) {
        console.log("Setting Classifiers");
        tagobj.tags.classifiers = true;
      }
      if (formData.modelType === "discogs-effnet") {
        console.log("Setting Discogs-Effnet");
        tagobj.tags.genre_discogs_effnet = true;
      }
      if (formData.modelType === "musicnn") {
        console.log("Setting Musicnn");
        tagobj.tags.genre_musicnn = true;
      }
      if (formData.modelType === "magnatagatune") {
        console.log("Setting Magnatagatune");
        tagobj.tags.genre_magnatagatune = true;
      }
      if (req.body.fileName == null) {
        return res.status(400).json({ message: "Please input a filename" });
      }
      if (req.fileValidationError) {
        var err = req.fileValidationError;
        if (err.match(/large/)) {
          return res.status(415).json({ message: "File is too large" });
          return;
        } else if (err.match(/extension|mimetype/)) {
          return res.status(415).json({ message: "Please submit valid MP3 files only" });
          return;
        }
      }
      const fileName = `${req.file.originalname}`;
      const filepath = path.join(uploadsDir, fileName);
      (async () => {
        console.log("before start");
        if (req.file) {
          const fileName2 = `${req.file.originalname}`;
          const filePath = path.join(uploadsDir, fileName2);
          fs.writeFileSync(filePath, req.file.buffer);
          validatedData.fileName = fileName2;
          validatedData.fileSize = req.file.size;
          validatedData.fileType = req.file.mimetype;
        }
        console.log("FORMDATA !!!!!!!!!!!!!!!!!!!!");
        console.log(validatedData);
        const storedSubmission = await storage.createFormSubmission(validatedData);
        console.log("Form submission received and stored:", storedSubmission);
        const fastapi_call = start(filepath, tagobj).then((response) => {
          console.log("*********************************Received outside:", response);
          console.log(response);
          switch (response.status) {
            case 200:
              validatedData.faid = response.data.id;
              console.log(response.data.id);
              return res.status(200).json({ message: "Form submitted successfully", data: validatedData });
              break;
            case 404:
              return res.status(500).json({ message: "Error with backend" });
              break;
            case 413:
              return res.status(500).json({ message: "Error with backend" });
              break;
            case 422:
              return res.status(500).json({ message: "Error with backend" });
              break;
            case 503:
              return res.status(500).json({ message: "Error with backend" });
              break;
            default:
              return res.status(500).json({ message: "Error with backend" });
              break;
          }
        });
        await fastapi_call;
        console.log("BUDDDDDDDDDDDDDDDDDDD");
      })();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: validationError.message
        });
      }
      console.error("Error processing form submission:", error);
      return res.status(500).json({
        message: "Internal server error"
      });
    }
  });
  app2.get("/upload", function(req, res) {
    res.send('<!doctype html><html lang="en"><head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>Matnn Demo</title> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous"> </head> <body> <h1>Matnn (<u>M</u>usic <u>A</u>udio <u>T</u>agger <u>N</u>eural <u>N</u>et)</h1> <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script><form method="post" action="/api/form" enctype="multipart/form-data"><p>Audio File: <input type="file" name="file" /></p><p>Genre (Musicnn): <input type="checkbox" name="genre_musicnn" value="genre_musicnn"></p><p>Genre (Discogs-effnet): <input type="checkbox" name="genre_discogs_effnet" value="genre_discogs_effnet"></p><p>BPM: <input type="checkbox" name="bpm" value="bpm"></p><p>Key: <input type="checkbox" name="key" value="key"></p><p>Approachability / Engagement: <input type="checkbox" name="classifiers" value="classifiers"></p><p><input type="submit" value="Upload" /></p><h3>AI Powered by Sandman Technologies Inc</h3>      </body>   </html></form>');
  });
  app2.get("/api/status/:id", (req, res) => {
    let userIp = req.header("x-forwarded-for") || req.connection.remoteAddress;
    console.log("Source IP is: " + userIp);
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, status) {
      console.log(err);
      console.log(status);
      res.status(err).send(status);
    }, id, "status");
  });
  app2.get("/status/:id", (req, res) => {
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, status) {
      if (err) console.log("error", err);
      console.log("statuscode is " + err);
      console.log("status msg is " + status);
      res.status(err).render("status-wrapper", {
        id,
        status: JSON.stringify(status),
        title: "Kueue Job Status",
        header: "Some info about job status"
      });
    }, id, "status");
  });
  app2.get("/api/result/:id", (req, res) => {
    let userIp = req.header("x-forwarded-for") || req.connection.remoteAddress;
    console.log("Source IP is: " + userIp);
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, result) {
      if (err) console.log("error", err);
      console.log(result);
      res.status(err).send(result);
    }, id, "result");
  });
  app2.get("/result/:id", (req, res) => {
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, result) {
      if (err) console.log("error", err);
      console.log(result);
      res.status(err).render("result-wrapper", {
        id,
        result: JSON.stringify(result),
        title: "Kueue Job Result",
        header: "Some info about job result"
      });
    }, id, "result");
  });
  function gethttp_api(callback, id, rtype) {
    console.log("-----------------");
    console.log("ID");
    console.log(id);
    console.log("RTYPE");
    console.log(rtype);
    console.log("-----------------");
    http.get("http://localhost:8000/" + rtype + "/" + id, (res) => {
      let data = [];
      const headerDate = res.headers && res.headers.date ? res.headers.date : "no response date";
      console.log("Status Code:", res.statusCode);
      console.log("Date in Response header:", headerDate);
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        console.log("Response ended: ");
        var status = JSON.parse(Buffer.concat(data).toString());
        callback(res.statusCode, status);
      });
    }).on("error", (err) => {
      console.log("Error: ", err.message);
      callback(500, err.message);
    });
  }
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/tuti/upload": {
        "target": "https://localhost:8090",
        "changeOrigin": true,
        rewrite: (path4) => path4.replace(/^\/tuti/, "bud")
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "/vite-app/client/dist");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start3 = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start3;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 9090;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
