const mongoose = require("mongoose");

//CLAIRE
const loansSchema = mongoose.Schema({
  artItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "artitems",
  },
  startDate: Date,
  requestStatus: {
    type: String,
    enum: [
      // option enum dans le schéma Mongoose pour restreindre les valeurs acceptées pour le champ
      "INIT_DEMAND_DISPO", // Demande pour emprunter une oeuvre: l'artiste doit valider la dispo
      "PROPOSAL_OTHER_ARTITEM", // Oeuvre non dispo, l'artiste doit proposer une autre oeuvre
      "WAITING_ABONNEMENT", // Oeuvre dispo, abonnement nécéssaire: l'emprunteur doit s'abonner
      "WAITING_ABONNEMENT_DOCUMENTS", // Oeuvre dispo, documents nécéssaire: l'emprunteur doit fournir les documents pour pouvoir emprunter
      "WAITING_ABONNEMENT_CREDIT", // Oeuvre dispo, crédit d'abonnement insuffisant: l'emprunteur doit attendre d'avoir un crédit, ou doit augmenter l'abonnement
      "READY_LOAN", // RDV à prévoir pour effectuer l'emprunt
      "CONDITION_REPORT_DONE", // Etat des lieux fait, en attente de validation abonné
      "LOAN_ONGOING", // Emprunt en cours
      "RETURN_ASKED", // Retour demandé par l'artiste
      "RETURN_TIME", // Durée de l'emprunt terminé
      "RETURN_TIME_URGENT", // Délai de retour dépassé (abonnement terminé, demande de l'artiste)
      "RETURN_CONDITION_REPORT", // Etat des lieux retour
      "LOAN_DONE", // Etat des lieux validé, emprunt terminé
    ],
    required: true,
  },
  isExtendedLoan: Boolean,
  loanPhotos: [String],
  returnPhotos: [String],
});

const usersSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
  token: String,
  accountType: String,
  phone: String,
  address: String,
  avatar: String,
  acceptedGTC: Boolean,
  acceptedGCU: Boolean,
  favoriteItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "artitems",
    },
  ],
  subscription: {
    subscriptionType: String,
    createdAt: Date,
    updatedAt: Date,
    worksCount: Number,
    durationMonth: Number,
    price: Number,
    calculatedEndDate: Date,
    transactionId: String,
    transactionStatus: String,
    transactionError: String,
    paymentDate: Date,
  },
  ongoingLoans: [loansSchema],
  previousLoans: [loansSchema],
  identityCard: {
    document: String,
    expirationDate: Date,
  },
  civilLiabilityCertificate: {
    document: String,
    expirationDate: Date,
  },
});

const Users = mongoose.model("users", usersSchema);

module.exports = Users;
