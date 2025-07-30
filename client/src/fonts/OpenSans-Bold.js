const OpenSansFontData = "base64_encoded_font_data_here";
jsPDF.API.addFileToVFS("OpenSans-Bold.ttf", OpenSansFontData);
jsPDF.API.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");