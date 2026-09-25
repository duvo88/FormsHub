using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.Json;

namespace api.Services
{
    public static class FormPdfGenerator
    {
        // Law Society orange color
        private static readonly string LawSocietyOrange = "#F26522";
        
        // ⚡ Static constructor ensures QuestPDF license is set before any method runs
        static FormPdfGenerator()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        private static byte[] GetLogoBytes()
        {
            try
            {
                // Load PNG logo from the function app directory
                string logoPath = Path.Combine(AppContext.BaseDirectory, "LSNSW_Logo_RGB_Orange_Linear.png");
                if (File.Exists(logoPath))
                {
                    return File.ReadAllBytes(logoPath);
                }
                
                // Fallback: return empty byte array (will use text fallback)
                return Array.Empty<byte>();
            }
            catch
            {
                // If logo can't be loaded, return empty array
                return Array.Empty<byte>();
            }
        }

        private static void Radio(IContainer container, bool selected)
        {
            var svg = selected
                ? "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\"><circle cx=\"6\" cy=\"6\" r=\"5\" fill=\"none\" stroke=\"black\" stroke-width=\"1\"/><circle cx=\"6\" cy=\"6\" r=\"2.5\" fill=\"black\"/></svg>"
                : "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\"><circle cx=\"6\" cy=\"6\" r=\"5\" fill=\"none\" stroke=\"black\" stroke-width=\"1\"/></svg>";

            container
                .Width(12)
                .Height(12)
                .Svg(svg);
        }

        private static void Checkbox(IContainer container, bool selected)
        {
            var svg = selected
                ? "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\"><rect x=\"0.5\" y=\"0.5\" width=\"11\" height=\"11\" fill=\"none\" stroke=\"black\" stroke-width=\"1\"/><polyline points=\"2,6 5,9 10,3\" fill=\"none\" stroke=\"black\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"
                : "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\"><rect x=\"0.5\" y=\"0.5\" width=\"11\" height=\"11\" fill=\"none\" stroke=\"black\" stroke-width=\"1\"/></svg>";

            container
                .Width(12)
                .Height(12)
                .Svg(svg);
        }

        public static byte[] GenerateFormPdf(string formName, JsonElement formData, Dictionary<string, string>? fieldLabels = null, Dictionary<string, string>? sectionLabels = null)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header()
                        .ShowOnce()
                        .Column(col =>
                        {
                            // Header row with title and logo (matching frontend header)
                            col.Item().Row(row =>
                            {
                                // Title on left - matching frontend styling (25px → 18pt for PDF)
                                row.RelativeItem().AlignLeft().Text(formName)
                                    .Bold()
                                    .FontSize(18)
                                    .FontColor(LawSocietyOrange)
                                    .FontFamily("Arial")
                                    .LineHeight(1.1f);
                                
                                // Spacing between title and logo (80px → 60pt for PDF)
                                row.ConstantItem(60);
                                
                                // Logo on right with margin around it (20px margin)
                                var logoBytes = GetLogoBytes();
                                if (logoBytes.Length > 0)
                                {
                                    row.AutoItem().AlignRight().PaddingLeft(15).PaddingRight(15).Height(40).Image(logoBytes);
                                }
                                else
                                {
                                    // Fallback: text if logo not available
                                    row.AutoItem().AlignRight().PaddingLeft(15).PaddingRight(15).Text("The Law Society of\nNew South Wales")
                                        .FontSize(9)
                                        .FontColor(LawSocietyOrange)
                                        .FontFamily("Arial")
                                        .LineHeight(1.2f);
                                }
                            });
                            
                            // Orange separator line (matching section separators)
                            col.Item().PaddingTop(8).LineHorizontal(1).LineColor(LawSocietyOrange);
                        });

                    page.Content()
                        .PaddingVertical(10)
                        .Column(col =>
                        {
                            col.Spacing(3);
                            // Render form data
                            RenderFormData(col, formData, fieldLabels, sectionLabels);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Page ").FontSize(8).FontColor(Colors.Grey.Darken1);
                            x.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Darken1);
                        });
                });
            });

            return document.GeneratePdf();
        }

        private static void RenderFormData(ColumnDescriptor col, JsonElement formData, Dictionary<string, string>? fieldLabels = null, Dictionary<string, string>? sectionLabels = null)
        {
            foreach (var section in formData.EnumerateObject())
            {
                // Skip metadata fields that shouldn't appear in PDF
                if (section.Name.Equals("SubmittedAt", StringComparison.OrdinalIgnoreCase) ||
                    section.Name.Equals("FormType", StringComparison.OrdinalIgnoreCase) ||
                    section.Name.Equals("SubmissionId", StringComparison.OrdinalIgnoreCase))
                    continue;

                // Section header in orange with separator line
                var sectionHeaderText = (sectionLabels != null && sectionLabels.TryGetValue(section.Name, out var sl)) ? sl.ToUpper() : FormatSectionHeader(section.Name);
                col.Item().PaddingTop(12).Column(secCol =>
                {
                    secCol.Item().Text(sectionHeaderText)
                        .Bold()
                        .FontSize(10)
                        .FontColor(LawSocietyOrange);
                    
                    secCol.Item().LineHorizontal(1).LineColor(LawSocietyOrange);
                });

                // Section content
                col.Item().PaddingTop(5);
                
                if (section.Value.ValueKind == JsonValueKind.Object)
                {
                    RenderSectionFields(col, section.Value, fieldLabels);
                }
                else if (section.Value.ValueKind == JsonValueKind.Array)
                {
                    RenderArraySection(col, section.Value, fieldLabels);
                }
                else
                {
                    var valueStr = GetValueString(section.Value);
                    if (!string.IsNullOrWhiteSpace(valueStr))
                    {
                        col.Item().PaddingTop(3).Text(valueStr);
                    }
                }
            }
        }

        private static void RenderSectionFields(ColumnDescriptor col, JsonElement sectionData, Dictionary<string, string>? fieldLabels = null)
        {
            var processedFields = new HashSet<string>();
            
            foreach (var field in sectionData.EnumerateObject())
            {
                if (processedFields.Contains(field.Name)) continue;
                
                var label = (fieldLabels != null && fieldLabels.TryGetValue(field.Name, out var fl)) ? fl
                    : System.Text.RegularExpressions.Regex.Replace(field.Name, "(\\B[A-Z])", " $1") is var r && r.Length > 0 ? char.ToUpper(r[0]) + r.Substring(1) : field.Name;
                
                if (field.Value.ValueKind == JsonValueKind.Object)
                {
                    // Nested object - render as subsection
                    col.Item().PaddingTop(5).Text(label).SemiBold().FontSize(9);
                    RenderSectionFields(col, field.Value, fieldLabels);
                }
                else if (field.Value.ValueKind == JsonValueKind.Array)
                {
                    // Array field
                    col.Item().PaddingTop(3).Text(txt =>
                    {
                        txt.Span($"{label}: ").SemiBold();
                    });
                    RenderArraySection(col, field.Value, fieldLabels);
                }
                else if (field.Value.ValueKind == JsonValueKind.True)
                {
                    // Boolean field that's true - check for associated text field
                    string textFieldName = field.Name + "Text";
                    if (sectionData.TryGetProperty(textFieldName, out JsonElement textElement) && 
                        textElement.ValueKind == JsonValueKind.String)
                    {
                        // Use the text from the associated field with checkbox
                        var fullText = textElement.GetString();
                        if (!string.IsNullOrWhiteSpace(fullText))
                        {
                            col.Item().PaddingTop(3).Row(row =>
                            {
                                row.ConstantItem(14).Element(c => Checkbox(c, true));
                                row.RelativeItem().PaddingLeft(5).Text(fullText).FontSize(10);
                            });
                            processedFields.Add(textFieldName); // Mark text field as processed
                        }
                    }
                    else
                    {
                        // No text field, show in table format with checkbox
                        col.Item().PaddingTop(3).Row(row =>
                        {
                            row.ConstantItem(14).Element(c => Checkbox(c, true));
                            row.RelativeItem(2).PaddingLeft(5).AlignLeft().Text(label).SemiBold().FontSize(10);
                            row.RelativeItem(3).AlignRight().Text("Yes").FontSize(10);
                        });
                    }
                }
                else if (field.Value.ValueKind == JsonValueKind.False)
                {
                    // Boolean field that's false - skip it (don't show unchecked checkboxes)
                    continue;
                }
                else if (field.Name.EndsWith("Text", StringComparison.OrdinalIgnoreCase) && !processedFields.Contains(field.Name))
                {
                    // Skip standalone text fields (they're rendered with their checkbox/radio)
                    processedFields.Add(field.Name);
                    continue;
                }
                else
                {
                    var value = GetValueString(field.Value);
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        // Check if there's an associated text field (for radio buttons, select fields, etc.)
                        string textFieldName = field.Name + "Text";
                        if (sectionData.TryGetProperty(textFieldName, out JsonElement textElement) && 
                            textElement.ValueKind == JsonValueKind.String)
                        {
                            var fullText = textElement.GetString();
                            if (!string.IsNullOrWhiteSpace(fullText))
                            {
                                // Special case: appointmentType shouldn't show label (section already says it)
                                if (field.Name.Equals("appointmentType", StringComparison.OrdinalIgnoreCase))
                                {
                                    col.Item().PaddingTop(2).Row(row =>
                                    {
                                        row.ConstantItem(14).Element(c => Radio(c, true));
                                        row.RelativeItem().PaddingLeft(5).Text(fullText).FontSize(10);
                                    });
                                }
                                else
                                {
                                    // Radio button style: question as header, bullet point with selected value
                                    col.Item().PaddingTop(8).Text(label)
                                        .SemiBold()
                                        .FontSize(10)
                                        .FontColor(LawSocietyOrange);
                                    
                                    col.Item().PaddingTop(2).Row(row =>
                                    {
                                        row.ConstantItem(14).Element(c => Radio(c, true));
                                        row.RelativeItem().PaddingLeft(5).Text(fullText).FontSize(10);
                                    });
                                }
                                processedFields.Add(textFieldName);
                            }
                            else
                            {
                                // Text field is empty, show in table format
                                col.Item().PaddingTop(3).Row(row =>
                                {
                                    row.RelativeItem(2).AlignLeft().Text(label).SemiBold().FontSize(10);
                                    row.RelativeItem(3).AlignRight().Text(value).FontSize(10);
                                });
                            }
                        }
                        else
                        {
                            // Special handling for trainingOption - map values to descriptive text
                            if (field.Name.Equals("trainingOption", StringComparison.OrdinalIgnoreCase))
                            {
                                var displayText = value switch
                                {
                                    "section_2_2" => "(A) I have completed training and assessment in accordance with Section 2.2 of the Mediator Accreditation Requirements",
                                    "nmas_amdras" => "(B) I have current accreditation under NMAS/AMDRAS",
                                    _ => value
                                };
                                
                                col.Item().PaddingTop(8).Text(label)
                                    .SemiBold()
                                    .FontSize(10)
                                    .FontColor(LawSocietyOrange);
                                
                                col.Item().PaddingTop(2).Row(row =>
                                {
                                    row.ConstantItem(14).Element(c => Radio(c, true));
                                    row.RelativeItem().PaddingLeft(5).Text(displayText).FontSize(10);
                                });
                            }
                            // Special handling for mediationTrainingProgram - map values to descriptive text
                            else if (field.Name.Equals("mediationTrainingProgram", StringComparison.OrdinalIgnoreCase))
                            {
                                var displayText = value switch
                                {
                                    "college_of_law" => "The College of Law - Nationally Accredited Mediator Training Program",
                                    "resolution_institute" => "Resolution Institute - Mediation Training and Assessment Course",
                                    "mediation_institute" => "Mediation Institute - Mediator Training and Assessment Course",
                                    "adc" => "Australian Dispute Centre (ADC) - Mediation Training Course",
                                    "aiflam" => "Australian Institute of Family Law Arbitrators and Mediators (AIFLAM) - Mediation Training and Assessment Course",
                                    _ => value
                                };
                                
                                col.Item().PaddingTop(8).Text(label)
                                    .SemiBold()
                                    .FontSize(10)
                                    .FontColor(LawSocietyOrange);
                                
                                col.Item().PaddingTop(2).Row(row =>
                                {
                                    row.ConstantItem(14).Element(c => Radio(c, true));
                                    row.RelativeItem().PaddingLeft(5).Text(displayText).FontSize(10);
                                });
                            }
                            else
                            {
                                // No text field, show in table format
                                col.Item().PaddingTop(3).Row(row =>
                                {
                                    row.RelativeItem(2).AlignLeft().Text(label).SemiBold().FontSize(10);
                                    row.RelativeItem(3).AlignRight().Text(value).FontSize(10);
                                });
                            }
                        }
                    }
                }
            }
        }

        private static void RenderArraySection(ColumnDescriptor col, JsonElement arrayData, Dictionary<string, string>? fieldLabels = null)
        {
            int index = 1;
            foreach (var item in arrayData.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.Object)
                {
                    col.Item().PaddingTop(6).PaddingLeft(10).Text($"Item {index}:").SemiBold().FontSize(9);
                    col.Item().PaddingLeft(10).Column(subCol =>
                    {
                        RenderSectionFields(subCol, item, fieldLabels);
                    });
                }
                else
                {
                    var valueStr = GetValueString(item);
                    if (!string.IsNullOrWhiteSpace(valueStr))
                    {
                        col.Item().PaddingTop(2).PaddingLeft(10).Text($"• {valueStr}");
                    }
                }
                index++;
            }
        }

        private static string FormatSectionHeader(string sectionName)
        {
            // Convert to readable format and uppercase
            var formatted = System.Text.RegularExpressions.Regex.Replace(sectionName, "(\\B[A-Z])", " $1");
            return formatted.ToUpper().Trim();
        }

        private static string GetValueString(JsonElement value)
        {
            return value.ValueKind switch
            {
                JsonValueKind.String => value.GetString() ?? "",
                JsonValueKind.Number => value.GetDouble().ToString(),
                JsonValueKind.True => "Yes",
                JsonValueKind.False => "No",
                JsonValueKind.Null => "",
                _ => value.ToString()
            };
        }
    }
}