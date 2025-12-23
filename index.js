const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

// ===== CONFIG =====

const PIX = "rnloiola25@gmail.com";
// IDs IMPORTANTES
const CANAL_LOJA_ID = "1450565964654444759";
const CATEGORIA_PEDIDOS_ID = "1450575470264320071";

// IMAGENS
const IMAGEM_LOJA = "https://i.imgur.com/SL7RGrU.png"; // primeira mensagem do bot
const IMAGEM_ZENNY = "https://i.imgur.com/mKpKosO.gif"; // carrinho Zenny
const IMAGEM_LEECH = "https://imgur.com/pDD0Mad.gif"; // carrinho Leech

// PRODUTOS
const produtos = {
  zenny: { nome: "Zenny", preco: 5, estoque: 50 },
  leech: { nome: "Leech", preco: 20, estoque: 200 }
};

// carrinho por usuário
const carrinho = {};

// ===== BOT ONLINE =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", async () => {
  console.log("🤖 Bot online");

  const canal = await client.channels.fetch(CANAL_LOJA_ID);
  if (!canal) return console.log("❌ Canal da loja não encontrado");

  const embed = new EmbedBuilder()
    .setTitle("🛒 Loja Oficial")
    .setDescription(
      "**🪙 Zenny**\n" +
      `💰 R$ ${produtos.zenny.preco} | 📦 ${produtos.zenny.estoque}\n\n` +
      "**🧑‍🤝‍🧑 Leech**\n" +
      `💰 R$ ${produtos.leech.preco} | 📦 ${produtos.leech.estoque}`
    )
    .setColor("Gold")
    .setImage(IMAGEM_LOJA)
    .setFooter({ text: "Selecione um produto abaixo" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("comprar_zenny")
      .setLabel("🪙 Comprar Zenny")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("comprar_leech")
      .setLabel("🧑‍🤝‍🧑 Comprar Leech")
      .setStyle(ButtonStyle.Primary)
  );

  await canal.bulkDelete(10).catch(() => {});
  canal.send({ embeds: [embed], components: [row] });
});

// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // ===== SELEÇÃO DO PRODUTO =====
  if (interaction.customId.startsWith("comprar_")) {
    const produtoId = interaction.customId.replace("comprar_", "");
    carrinho[userId] = { produto: produtoId, qtd: 1 };

    return interaction.reply({
      embeds: [embedCarrinho(userId)],
      components: [botoesCarrinho()],
      ephemeral: true
    });
  }

  if (!carrinho[userId]) return;

  if (interaction.customId === "mais") carrinho[userId].qtd++;
  if (interaction.customId === "menos" && carrinho[userId].qtd > 1)
    carrinho[userId].qtd--;

  // ===== FINALIZAR =====
  if (interaction.customId === "finalizar") {
    const item = carrinho[userId];
    const produto = produtos[item.produto];
    const total = item.qtd * produto.preco;
    const pin = Math.floor(1000 + Math.random() * 9000);

    const canalPedido = await interaction.guild.channels.create({
      name: `pedido-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_PEDIDOS_ID,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });

    produto.estoque -= item.qtd;

    canalPedido.send(
      `🧾 **Pedido Criado**\n\n` +
      `Produto: ${produto.nome}\n` +
      (produto.nome === "Leech" ? `Horas: ${item.qtd}\n` : `Quantidade: ${item.qtd}\n`) +
      `Total: R$ ${total}\n\n` +
      `💠 PIX: ${PIX}\n` +
      `🔐 PIN: ${pin}`
    );

    delete carrinho[userId];

    return interaction.reply({
      content: "✅ Pedido criado! Confira o novo canal.",
      ephemeral: true
    });
  }

  await interaction.update({
    embeds: [embedCarrinho(userId)],
    components: [botoesCarrinho()]
  });
});

// ===== FUNÇÕES =====
function embedCarrinho(userId) {
  const item = carrinho[userId];
  const produto = produtos[item.produto];

  // Decide se mostra "Zenny" ou "Hora(s)"
  const alterador = produto.nome === "Zenny" ? "Zenny" : "Hora(s)";

  // Define a imagem correta para o carrinho
  let imagemCarrinho;
  if (!item) imagemCarrinho = IMAGEM_LOJA;
  else if (produto.nome === "Zenny") imagemCarrinho = IMAGEM_ZENNY;
  else imagemCarrinho = IMAGEM_LEECH;

  return new EmbedBuilder()
    .setTitle(`🧾 Carrinho - ${produto.nome}`)
    .setDescription(
      `**${item.qtd} ${alterador}**\n` +
      `Valor: **R$ ${item.qtd * produto.preco}**`
    )
    .setColor("Green")
    .setImage(imagemCarrinho);
}

function botoesCarrinho() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("menos").setLabel("➖").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("mais").setLabel("➕").setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("finalizar")
      .setLabel("Finalizar Pedido")
      .setStyle(ButtonStyle.Primary)
  );
}

client.login(TOKEN);
