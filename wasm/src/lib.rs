use serde::Deserialize;
use wasm_bindgen::prelude::*;
use vtracer::{ColorImage, Config, FitMode, Hierarchical};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TraceOptions {
    preset: Option<String>,
    colors: Option<usize>,
    detail: Option<f64>,
    smoothness: Option<f64>,
    path_omit: Option<usize>,
}

#[wasm_bindgen]
pub fn trace_rgba(
    rgba: &[u8],
    width: u32,
    height: u32,
    options_json: &str,
) -> Result<String, JsValue> {
    if width == 0 || height == 0 {
        return Err(JsValue::from_str("Image dimensions must be greater than zero."));
    }

    let expected = (width as usize)
        .checked_mul(height as usize)
        .and_then(|pixels| pixels.checked_mul(4))
        .ok_or_else(|| JsValue::from_str("Image dimensions are too large."))?;

    if expected != rgba.len() {
        return Err(JsValue::from_str("Image pixel data does not match its dimensions."));
    }

    const MAX_PIXELS: usize = 40_000_000;
    if expected / 4 > MAX_PIXELS {
        return Err(JsValue::from_str("This image is too large to trace safely in the browser. Try an image under 40 megapixels."));
    }

    let options: TraceOptions = serde_json::from_str(options_json)
        .map_err(|error| JsValue::from_str(&format!("Invalid tracing settings: {error}")))?;

    let preset = options.preset.as_deref().unwrap_or("logo");
    let mut config = Config::default();

    // Spline fitting is the key quality difference: it fits smooth cubic
    // Bézier curves while preserving detected corners.
    config.mode = FitMode::Spline;
    config.hierarchical = Hierarchical::Cutout;
    config.max_colors = Some(options.colors.unwrap_or(8).clamp(2, 32));
    config.filter_speckle = options.path_omit.unwrap_or(4).clamp(1, 32);
    config.length_threshold = options.detail.unwrap_or(4.0).clamp(0.5, 12.0);
    config.simplify = Some(options.smoothness.unwrap_or(0.7).clamp(0.0, 3.0));
    config.corner_threshold = 60;
    config.splice_threshold = 45;
    config.max_iterations = 20;
    config.path_precision = Some(2);
    config.optimize = 2;

    match preset {
        "logo" => {
            config.color_precision = 8;
            config.layer_difference = 8;
            config.filter_speckle = options.path_omit.unwrap_or(3).clamp(1, 12);
            config.simplify = Some(options.smoothness.unwrap_or(0.45).clamp(0.1, 1.5));
            config.length_threshold = options.detail.unwrap_or(2.0).clamp(0.5, 6.0);
        }
        "illustration" => {
            config.color_precision = 7;
            config.layer_difference = 16;
            config.filter_speckle = options.path_omit.unwrap_or(2).clamp(1, 10);
            config.simplify = Some(options.smoothness.unwrap_or(0.7).clamp(0.1, 2.0));
        }
        "photo" => {
            config.color_precision = 8;
            config.layer_difference = 32;
            config.filter_speckle = options.path_omit.unwrap_or(8).clamp(2, 20);
            config.simplify = Some(options.smoothness.unwrap_or(1.2).clamp(0.2, 3.0));
        }
        _ => return Err(JsValue::from_str("Unknown tracing preset.")),
    }

    let image = ColorImage {
        pixels: rgba.to_vec(),
        width: width as usize,
        height: height as usize,
    };

    config
        .build()
        .and_then(|pipeline| pipeline.to_svg(&image))
        .map_err(|error| JsValue::from_str(&format!("VTracer failed: {error}")))
}
