#!/bin/bash

# ---------------------------------------------
# Traffic Simulation Script for Insurance App
# ---------------------------------------------
# Usage:
# 1. Download this script and the 'uploads' folder with sample images.
# 2. In your OpenShift project, set the ROUTE_URL environment variable:
#    export ROUTE_URL=https://$(oc get route --no-headers | awk '{print $2}')/api/submit-application
# 3. Make the script executable:
#    chmod +x simulate_traffic.sh
# 4. Run the script:
#    ./simulate_traffic.sh
#
# The script will POST 10 sample applications with images to your app so that you can check IBM Cloud Observability tools for traffic.
#
# DISCLAIMER: All names, addresses, and likenesses used in this script and sample data are fictitious.
# Any resemblance to real persons, living or dead, is purely coincidental.
# ---------------------------------------------

# Get the Route URL from the environment variable
ROUTE_URL="${ROUTE_URL:-}"

if [ -z "$ROUTE_URL" ]; then
  echo "ERROR: ROUTE_URL is not set."
  echo "Set it with:"
  echo "export ROUTE_URL=https://\$(oc get route --no-headers | awk '{print \$2}')/api/submit-application"
  exit 1
fi

# Sample data arrays
FIRST_NAMES=("John" "Ima" "Superbad" "Jelani" "Heidi" "Brenna" "Andrew" "Juana" "Andre" "John")
LAST_NAMES=("Smith" "Cardholder" "McLovin" "Sample" "Sample" "Murphy" "Sample" "Martinez" "Renee" "Sample")
ADDRESSES=("1234 Any Street" "2570 24th Street" "892 Momona Street" "123 Sample Drive" "123 North State Street" "111 Anywhere Street City" "123 Main Street" "2233 Calle Heterocuadruples" "3300 Acorn Street" "200 South Main Street")
CITIES=("Any town" "Anytown" "Honolulu" "Anytown" "Trenton" "Delaware" "Harrisburg" "San Juan" "Austin" "Salt Lake City")
STATES=("Georgia" "California" "Hawaii" "Nevada" "New Jersey" "New York" "Pennsylvania" "Puerto Rico" "Texas" "Utah")
ZIPCODES=("33333" "95818" "96820" "12345" "08666" "" "17101" "00987" "12345" "84115")
IMAGES=("Atlanta_DL.jpg" "California_DL.jpg" "Hawaii_DL.jpg" "Nevada_DL.jpg" "NewJersey_DL.jpg" "NYC_DL.webp" "Pennsylvania_DL.webp" "PuertoRico_DL.jpg" "Texas_DL.webp" "Utah_DL.jpeg")

# Loop through each sample and submit the form
for i in "${!IMAGES[@]}"; do
  curl -X POST "$ROUTE_URL" \
    -F "firstName=${FIRST_NAMES[$i]}" \
    -F "lastName=${LAST_NAMES[$i]}" \
    -F "address=${ADDRESSES[$i]}" \
    -F "city=${CITIES[$i]}" \
    -F "state=${STATES[$i]}" \
    -F "zipcode=${ZIPCODES[$i]}" \
    -F "creditScore=good" \
    -F "driversLicenseImage=@uploads/${IMAGES[$i]}"
  echo "Submitted: ${FIRST_NAMES[$i]} ${LAST_NAMES[$i]}"
done
