use rust_xlsxwriter::{Format, FormatAlign, FormatBorder, Workbook};
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Write};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportColumn {
    pub key: String,
    pub title: String,
    pub data_type: String, // "text", "currency", "number", "date", "percent"
    pub width: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportReportRequest {
    pub title: String,
    pub subtitle: Option<String>,
    pub company_name: String,
    pub date_range: Option<String>,
    pub columns: Vec<ExportColumn>,
    pub rows: Vec<serde_json::Value>,
    pub is_rtl: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BatchZipFileItem {
    pub filename: String,
    pub content_base64: Option<String>,
    pub content_text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BatchZipExportRequest {
    pub zip_filename: String,
    pub files: Vec<BatchZipFileItem>,
}

/// Generates a fully-formatted, native Excel workbook buffer (.xlsx) with true RTL support.
pub fn generate_xlsx(request: &ExportReportRequest) -> Result<Vec<u8>, String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    if request.is_rtl {
        worksheet.set_right_to_left(true);
    }

    let reading_dir = if request.is_rtl { 2 } else { 1 };

    // Format styles
    let title_format = Format::new()
        .set_bold()
        .set_font_size(16)
        .set_font_name("Segoe UI")
        .set_reading_direction(reading_dir);

    let subtitle_format = Format::new()
        .set_italic()
        .set_font_size(10)
        .set_font_name("Segoe UI")
        .set_font_color("#64748B")
        .set_reading_direction(reading_dir);

    let header_format = Format::new()
        .set_bold()
        .set_font_size(11)
        .set_font_name("Segoe UI")
        .set_background_color("#1E293B")
        .set_font_color("#FFFFFF")
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center)
        .set_reading_direction(reading_dir);

    let text_format = Format::new()
        .set_font_size(10)
        .set_font_name("Segoe UI")
        .set_border(FormatBorder::Thin)
        .set_reading_direction(reading_dir);

    let currency_format = Format::new()
        .set_font_size(10)
        .set_font_name("Segoe UI")
        .set_num_format("#,##0.00")
        .set_border(FormatBorder::Thin)
        .set_reading_direction(reading_dir);

    let int_format = Format::new()
        .set_font_size(10)
        .set_font_name("Segoe UI")
        .set_num_format("#,##0")
        .set_border(FormatBorder::Thin)
        .set_reading_direction(reading_dir);

    let percent_format = Format::new()
        .set_font_size(10)
        .set_font_name("Segoe UI")
        .set_num_format("0.00%")
        .set_border(FormatBorder::Thin)
        .set_reading_direction(reading_dir);

    let date_format = Format::new()
        .set_font_size(10)
        .set_font_name("Segoe UI")
        .set_align(FormatAlign::Center)
        .set_border(FormatBorder::Thin)
        .set_reading_direction(reading_dir);

    // 1. Company Name & Title Header
    worksheet
        .write_string_with_format(0, 0, &request.company_name, &title_format)
        .map_err(|e| e.to_string())?;

    let report_title_line = format!(
        "{} {}",
        request.title,
        request
            .date_range
            .as_ref()
            .map(|d| format!("({})", d))
            .unwrap_or_default()
    );
    worksheet
        .write_string_with_format(1, 0, &report_title_line, &title_format)
        .map_err(|e| e.to_string())?;

    if let Some(ref sub) = request.subtitle {
        worksheet
            .write_string_with_format(2, 0, sub, &subtitle_format)
            .map_err(|e| e.to_string())?;
    }

    let start_row: u32 = if request.subtitle.is_some() { 4 } else { 3 };

    // 2. Write Column Headers
    for (col_idx, col) in request.columns.iter().enumerate() {
        worksheet
            .write_string_with_format(start_row, col_idx as u16, &col.title, &header_format)
            .map_err(|e| e.to_string())?;
    }

    // Freeze panes below header
    worksheet.set_freeze_panes(start_row + 1, 0).map_err(|e| e.to_string())?;

    // Track column width for auto-sizing
    let mut col_max_len: Vec<usize> = request
        .columns
        .iter()
        .map(|c| c.title.chars().count() + 4)
        .collect();

    // 3. Write Data Rows
    for (r_idx, row_val) in request.rows.iter().enumerate() {
        let current_row = start_row + 1 + r_idx as u32;

        for (c_idx, col) in request.columns.iter().enumerate() {
            let field_val = row_val.get(&col.key);

            match col.data_type.as_str() {
                "currency" => {
                    let num = match field_val {
                        Some(serde_json::Value::Number(n)) => {
                            if let Some(i) = n.as_i64() {
                                i as f64 / 100.0 // Convert cents to standard units
                            } else {
                                n.as_f64().unwrap_or(0.0)
                            }
                        }
                        Some(serde_json::Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
                        _ => 0.0,
                    };
                    worksheet
                        .write_number_with_format(
                            current_row,
                            c_idx as u16,
                            num,
                            &currency_format,
                        )
                        .map_err(|e| e.to_string())?;
                    let len = format!("{:.2}", num).len() + 4;
                    if len > col_max_len[c_idx] {
                        col_max_len[c_idx] = len;
                    }
                }
                "number" => {
                    let num = match field_val {
                        Some(serde_json::Value::Number(n)) => n.as_f64().unwrap_or(0.0),
                        Some(serde_json::Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
                        _ => 0.0,
                    };
                    worksheet
                        .write_number_with_format(current_row, c_idx as u16, num, &int_format)
                        .map_err(|e| e.to_string())?;
                    let len = format!("{:.0}", num).len() + 3;
                    if len > col_max_len[c_idx] {
                        col_max_len[c_idx] = len;
                    }
                }
                "percent" => {
                    let pct = match field_val {
                        Some(serde_json::Value::Number(n)) => {
                            if let Some(i) = n.as_i64() {
                                (i as f64) / 100000.0 // e.g. 14000 milli -> 14% -> 0.14
                            } else {
                                n.as_f64().unwrap_or(0.0)
                            }
                        }
                        _ => 0.0,
                    };
                    worksheet
                        .write_number_with_format(current_row, c_idx as u16, pct, &percent_format)
                        .map_err(|e| e.to_string())?;
                }
                "date" => {
                    let s = match field_val {
                        Some(serde_json::Value::String(s)) => s.as_str(),
                        _ => "-",
                    };
                    worksheet
                        .write_string_with_format(current_row, c_idx as u16, s, &date_format)
                        .map_err(|e| e.to_string())?;
                    if s.len() > col_max_len[c_idx] {
                        col_max_len[c_idx] = s.len() + 3;
                    }
                }
                _ => {
                    let s = match field_val {
                        Some(serde_json::Value::String(s)) => s.as_str(),
                        Some(serde_json::Value::Number(n)) => &n.to_string(),
                        Some(serde_json::Value::Bool(b)) => {
                            if *b {
                                "نعم"
                            } else {
                                "لا"
                            }
                        }
                        Some(serde_json::Value::Null) | None => "-",
                        _ => "-",
                    };
                    worksheet
                        .write_string_with_format(current_row, c_idx as u16, s, &text_format)
                        .map_err(|e| e.to_string())?;
                    let len = s.chars().count() + 3;
                    if len > col_max_len[c_idx] {
                        col_max_len[c_idx] = len;
                    }
                }
            }
        }
    }

    // 4. Set Column Widths (min 12, max 45)
    for (c_idx, len) in col_max_len.iter().enumerate() {
        let width = if let Some(custom_w) = request.columns[c_idx].width {
            custom_w
        } else {
            (*len as f64).clamp(12.0, 45.0)
        };
        worksheet
            .set_column_width(c_idx as u16, width)
            .map_err(|e| e.to_string())?;
    }

    // 5. Save buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;
    Ok(buffer)
}

/// Creates a ZIP archive containing individual files (e.g. batch invoices / bills).
pub fn create_zip_archive(files: &[(String, Vec<u8>)]) -> Result<Vec<u8>, String> {
    let mut buffer = Vec::new();
    {
        let mut zip = ZipWriter::new(Cursor::new(&mut buffer));
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        for (filename, content) in files {
            zip.start_file(filename, options)
                .map_err(|e| format!("Failed to create zip entry {}: {}", filename, e))?;
            zip.write_all(content)
                .map_err(|e| format!("Failed to write content for {}: {}", filename, e))?;
        }

        zip.finish()
            .map_err(|e| format!("Failed to finalize zip archive: {}", e))?;
    }

    Ok(buffer)
}
